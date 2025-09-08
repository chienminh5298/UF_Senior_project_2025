import intervalPriceOrderInstance from "@src/classes/intervalPriceOrder";
import targetStorageInstance from "@src/classes/targetStorage";
import { logging, writeLog } from "@src/utils/log";
import { Token, User } from "@prisma/client";
import prisma from "@root/prisma/database";
import crypto from "crypto";

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

export const calculateMarkPrice = (percent: number, entryPrice: number, orderSide: "SELL" | "BUY") => {
    const differance = entryPrice * (percent / 100);
    if (orderSide === "SELL") {
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

export const roundQtyToNDecimal: (qty: string | number, minQty: number) => number = (qty: string | number, minQty: number) => {
    const precision = getPrecisionDigits(minQty);
    const indexOfDot = qty.toString().indexOf(".");
    let result = qty;
    if (indexOfDot !== -1) {
        result = qty.toString().slice(0, indexOfDot + precision + 1);
    }
    result = result.toString();
    return parseFloat(result);
};

type calculateProfitType = {
    side: "SELL" | "BUY";
    entryPrice: number;
    markPrice: number;
    qty: number;
};
export const calculateProfit = ({ side, entryPrice, markPrice, qty }: calculateProfitType) => {
    if (side === "SELL") {
        return (entryPrice - markPrice) * qty;
    } else {
        return (markPrice - entryPrice) * qty;
    }
};

export const isCloseIntervalToken = async (token: string, stable: string) => {
    const orders = Object.keys(targetStorageInstance.getOrderTargetOfToken(token));

    if (orders.length === 0) {
        intervalPriceOrderInstance.removeInterval(token + stable);
    }
};

export const calculateProfitPercent = (entryPrice: number, sellPrice: number, side: "SELL" | "BUY") => {
    if (side === "BUY") {
        return ((sellPrice - entryPrice) * 100) / entryPrice;
    } else {
        return ((entryPrice - sellPrice) * 100) / entryPrice;
    }
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
        // ➊ Số % hoa hồng gốc
        let adminCom = user.adminCommissionPercent; // ví dụ 8
        let refCom = user.referralCommissionPercent; // ví dụ 2

        const totalBefore = (adminCom + refCom) * 100; // 10

        // ➋ Tìm voucher đang dùng
        const voucher = await prisma.voucher.findFirst({
            where: {
                userId: user.id,
                status: "inuse",
                expireDate: { gt: new Date() },
            },
        });

        if (voucher) {
            if (voucher.type === "DC") {
                // giảm cố định -> phân bổ theo tỉ lệ gốc
                const adminRatio = adminCom / totalBefore; // 0.8
                const refRatio = refCom / totalBefore; // 0.2

                adminCom -= voucher.value * adminRatio; // 8 - 2*0.8 = 6.4
                refCom -= voucher.value * refRatio; // 2 - 2*0.2 = 1.6
            }

            if (voucher.type === "DCP") {
                // giảm theo % trên từng khoản
                const factor = 1 - voucher.value / 100; // 1 - 0.10 = 0.9
                adminCom *= factor; // 8 * 0.9 = 7.2
                refCom *= factor; // 2 * 0.9 = 1.8
            }
        }

        // ➌ Không cho âm
        adminCom = Math.max(adminCom, 0);
        refCom = Math.max(refCom, 0);

        return {
            adminPercent: +adminCom.toFixed(4), // 4 chữ số thập phân
            referralPercent: +refCom.toFixed(4),
        };
    } catch (err) {
        console.error(`Error calculate commission percent – userId: ${user.id}`, err);
        return { adminPercent: 0, referralPercent: 0 };
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
        if (prevClose > prevOpen) return "BUY";
        else return "SELL";
    } else {
        if (prevClose > prevOpen) return "SELL";
        else return "BUY";
    }
};
