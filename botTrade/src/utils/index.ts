import intervalPriceOrderInstance from "@src/classes/intervalPriceOrder";
import { loadTargetToStorage } from "@src/handleOrders/handleTarget";
import { Token, Transaction, User } from "@prisma/client";
import { logging, writeLog } from "@src/utils/log";
import prisma from "@root/prisma/database";

/**
 - We will not open price socket for every token, just open socket for tokens which has at least 1 open order.
 - This function will find the token has at least 1 open order then will create a price socket to listen price changes.
 */
export const createTokenPriceInterval = async () => {
    const tokens: Token[] = await prisma.token.findMany({
        where: {
            orders: {
                some: {
                    status: "ACTIVE",
                },
            },
        },
    });

    tokens.forEach((token) => {
        // create interval token's price check
        let symbol = token.name + token.stable;
        intervalPriceOrderInstance.createIntervalPriceCheck(symbol, token.name);
    });
};

export const removeUSDT: (token: string) => string = (token: string) => {
    return token.slice(0, -4);
};

export const calculateMarkPrice = (percent: number, entryPrice: number, orderSide: "short" | "long") => {
    const differance = entryPrice * (percent / 100);
    if (orderSide === "short") {
        return entryPrice - differance;
    } else {
        return entryPrice + differance;
    }
};

export const roundStopPriceTo2Decimals = (price: string | number) => {
    var indexOfDot = price.toString().indexOf(".");
    const numDecimals = 2; // Binance only permit 2 decimal usdt
    var result = price;
    if (indexOfDot !== -1) {
        result = price.toString().slice(0, indexOfDot + numDecimals + 1);
    }
    result = result.toString();
    return parseFloat(result);
};

export const roundQtyToNDecimal: (price: string | number, minQty: number) => number = (price: string | number, minQty: number) => {
    const precision = getPrecisionDigits(minQty);
    var indexOfDot = price.toString().indexOf(".");
    var result = price;
    if (indexOfDot !== -1) {
        result = price.toString().slice(0, indexOfDot + precision + 1);
    }
    result = result.toString();
    return parseFloat(result);
};

interface calculateProfitType {
    side: "short" | "long";
    entryPrice: number;
    markPrice: number;
    qty: number;
}
export const calculateProfit = ({ side, entryPrice, markPrice, qty }: calculateProfitType) => {
    if (side === "short") {
        return (entryPrice - markPrice) * qty;
    } else {
        return (markPrice - entryPrice) * qty;
    }
};

export const isCloseIntervalToken = async (token: Token) => {
    let rootorders = await prisma.order.findMany({
        where: {
            tokenId: token.id,
        },
    });
    if (rootorders.length === 0) {
       intervalPriceOrderInstance.removeInterval(token.name + token.stable);
    }
};

export const calculateProfitPercent = (entryPrice: number, sellPrice: number, side: "short" | "long") => {
    if (side === "long") {
        return ((sellPrice - entryPrice) * 100) / entryPrice;
    } else {
        return ((entryPrice - sellPrice) * 100) / entryPrice;
    }
};

export const updateUserAsset = async () => {
    const users = await prisma.user.findMany({ where: { isActive: true } });
    for (let u of users) {
        // Update asset table
        await prisma.asset.create({
            data: { asset: u.availableBalance + u.profit + u.tradeBalance, userId: u.id },
        });

        // Update activity table
        await prisma.activity.create({
            data: {
                userId: u.id,
                type: 1,
                availableBalance: u.availableBalance,
                tradeBalance: u.tradeBalance,
                value: null,
            },
        });
    }
};

export const sumWithdrawTransactionByStatus: (status: "FINISHED" | "PENDING", userId?: number) => Promise<number> = async (status, userId) => {
    const query = await prisma.transaction.findMany({
        where: {
            ...(userId !== undefined && { userId }), // Only include userId if it's defined
            status: status,
            type: "WITHDRAW",
        },
    });
    return query.reduce((total: number, temp: Transaction) => total + temp.amount, 0);
};

export const sumDepositTransactionByStatus: (status: "FINISHED" | "PENDING", userId?: number) => Promise<number> = async (status, userId) => {
    const query = await prisma.transaction.findMany({
        where: {
            ...(userId !== undefined && { userId }), // Only include userId if it's defined
            status: status,
            type: "DEPOSIT",
        },
    });
    return query.reduce((total: number, temp: Transaction) => total + temp.amount, 0);
};

export const getTimeHour = () => {
    let date = new Date();
    return date.getHours();
};

export const getTimeMinute = () => {
    let date = new Date();
    return date.getMinutes();
};

export const getTimeSecond = () => {
    let date = new Date();
    return date.getSeconds();
};

export const handleError = (alert: string, type: string, writeLogParam: any[]) => {
    writeLog([alert, ...writeLogParam]);
    logging(type, alert);
};

const getPrecisionDigits = (floatNum: number) => {
    if (!Number.isFinite(floatNum)) {
        return 0; // Return 0 if it's not a valid finite number
    }

    // Convert the number to a string
    const floatStr = floatNum.toString();

    // Check if there's a decimal point
    if (floatStr.includes(".")) {
        // Return the length of digits after the decimal point
        return floatStr.split(".")[1].length;
    }

    return 0; // Return 0 if there's no decimal point
};

export const calculateCommissionPercent = async (user: User) => {
    try {
        let currentCom = user!.commissionPercent;
        const voucher = await prisma.voucher.findFirst({ where: { userId: user!.id, status: "inuse", expireDate: { gt: new Date() } } });
        if (voucher) {
            if (voucher.type === "DC") {
                currentCom = user!.commissionPercent - voucher.value;
            }
            if (voucher.type === "DCP") {
                currentCom = user!.commissionPercent - (voucher.value / 100) * user!.commissionPercent;
            }
        }
        if (currentCom < 0) currentCom = 0;
        return currentCom;
    } catch {
        console.log(`Error calculate commission percent ultils/index.ts - userId: ${user.id}`);
        return 0;
    }
};

export const checkExpireVouchers = async () => {
    const vouchers = await prisma.voucher.findMany({ where: { expireDate: { lt: new Date() } } });
    for (let v of vouchers) {
        await prisma.voucher.update({ where: { id: v.id }, data: { status: "expired" } });
    }
};

export const getOrderSideDependOnDirection = ({ direction, prevClose, prevOpen }: { direction: "OPPOSITE" | "SAME"; prevClose: number; prevOpen: number }) => {
    if (direction === "SAME") {
        if (prevClose > prevOpen) return "long";
        else return "short";
    } else {
        if (prevClose > prevOpen) return "short";
        else return "long";
    }
};