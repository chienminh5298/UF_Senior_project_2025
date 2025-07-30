import { $Enums, Order, Strategy, Target, Token, User, UserToken } from "@prisma/client";
import jsonbig from "json-bigint";

import { sendTelegramAdminMessage, sendTelegramMessage, telegramHitTargetPayload, telegramNewOrderPayload, telegramNotEnoughBalancePayload } from "@src/utils/telegram";
import { calculateMarkPrice, calculateProfit, handleError, isCloseIntervalToken, roundQtyToNDecimal } from "@src/utils";
import { cancelStoplossByOrder, newStoploss } from "@src/handleOrders/handleStoploss";
import { __payloadCloseOrder, __payloadNewOrder } from "@src/payload/binance";
import intervalPriceOrderInstance from "@src/classes/intervalPriceOrder";
import brokerInstancePool from "@src/classes/brokerInstancePool";
import targetStorageInstance from "@src/classes/targetStorage";
import { getNextTarget } from "@src/handleOrders/handleTarget";
import { candleType } from "@src/routes/backtest/backtest";
import { logging, writeLog } from "@src/utils/log";
import prisma from "@root/prisma/database";

/* -----------------------------------------------------------------------------------------------*
 * When root order opened => at least 1 sub order is opened and target is set in target's storage *
 *------------------------------------------------------------------------------------------------*/
type OpenOrderType = {
    token: Token;
    strategy: Strategy;
    side: $Enums.Side;
    forSpecifyUserId?: number;
};
export const openRootOrder = async ({ token, strategy, side, forSpecifyUserId = undefined }: OpenOrderType) => {
    const strategyId = strategy.id;
    const orderToken = token.name + token.stable;
    const broker = brokerInstancePool.getBroker();
    const price = await broker!.getPrice(orderToken);

    try {
        if (!price) {
            handleError("Can't get price to open root order - openRootOrder - handleRootOrders", "error", [price]);
            return;
        }

        // Find the first target to set stoploss && nextTarget to reach
        const { firstTarget, nextTarget } = await findFirstTargetAndNextTarget({ strategyId: strategy.id, tokenId: token.id });

        if (!firstTarget || !nextTarget) {
            const log = "Can't find any target - openRootOrder - handleRootOrders";
            sendTelegramAdminMessage(log);
            handleError(log, "error", [firstTarget, nextTarget]);
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                userTokens: {
                    some: {
                        tokenId: token.id,
                    },
                },
                ...(forSpecifyUserId !== undefined ? { id: forSpecifyUserId } : {}),
            },
        });

        /* ----------------------------------------------------------------
            Mở order cho từng account
        -----------------------------------------------------------------*/
        const results = await Promise.allSettled(
            users.map(async (user) => {
                const qty = await calculateOrderQty({ token, strategyId, price, user });
                if (!qty) {
                    // không đủ điều kiện => ghi nhận nhưng vẫn fulfilled
                    return { status: 204, userId: user.id }; // 204: skipped
                }
                return handleOpenOrder({
                    strategyId,
                    token,
                    qty,
                    side,
                    user,
                    firstTarget,
                    nextTarget,
                });
            })
        );

        /* ----------------------------------------------------------------
            Kiểm tra kết quả
        -----------------------------------------------------------------*/
        for (const r of results) {
            if (r.status === "fulfilled") {
                const { status, userId } = r.value as { status: number; userId: number };
                if (status === 204) {
                    try {
                        const userInfo = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true, tradeBalance: true } });
                        if (userInfo) {
                            sendTelegramMessage(telegramNotEnoughBalancePayload({ tradeBalance: userInfo.tradeBalance }), userInfo.telegramChatId);
                        }
                        writeLog([`UserId ${userId} not enough budget for new order.`]);
                    } catch {}
                }
            } else {
                handleError("error", "openRootOrder error", [r.reason]);
            }
        }
    } catch (err) {
        handleError(`Can't open order - openRootOrder - handleRootOrders`, "error", [err]);
    }
};

const findFirstTargetAndNextTarget = async ({ strategyId, tokenId }: { strategyId: number; tokenId: number }) => {
    // Find the first target to set stoploss
    const firstTarget = await prisma.target.findFirst({
        where: {
            strategyId: strategyId,
            tokenId: tokenId,
        },
        orderBy: {
            targetPercent: "asc",
        },
        take: 1,
    });

    // Find the next target to reach
    const nextTarget = await getNextTarget(firstTarget, tokenId, strategyId);

    return { firstTarget, nextTarget };
};

type HandleOpenRootOrderType = {
    strategyId: number;
    token: Token;
    qty: number;
    side: "BUY" | "SELL";
    user: User;
    firstTarget: Target;
    nextTarget: Target;
};

export const handleOpenOrder = async ({ strategyId, token, side, qty, user, firstTarget, nextTarget }: HandleOpenRootOrderType): Promise<{ status: number; message?: string }> => {
    const orderToken = token.name + token.stable;
    const broker = brokerInstancePool.getBroker(user.id);
    try {
        if (!broker) {
            const log = `Can't find broker for userId ${user.id} - ${user.email}`;
            handleError(log, "error", [brokerInstancePool.getPool()]);
            return { status: 400 };
        }

        // 1. Chỉnh đòn bẩy
        await broker.API_adjustLeverage(orderToken, token.leverage);

        // 2. Tạo payload & gửi lệnh
        const payload = __payloadNewOrder({ token: orderToken, side, qty }, token.minQty);
        let response = await broker.API_newOrder(payload);

        /* ---------- SUCCESS PATH ---------- */
        if (response.success) {
            await handleAfterOpenNewOrder({
                response,
                orderToken,
                strategyId,
                token,
                user,
                firstTarget,
                nextTarget,
            });
            return { status: 200 };
        }

        /* ---------- THỬ KHÔI PHỤC ---------- */
        const recoveryOrder = await recoverLatestOpenOrder({ symbol: orderToken, side, userId: user.id });
        if (recoveryOrder) {
            await handleAfterOpenNewOrder({
                response: recoveryOrder,
                orderToken,
                strategyId,
                token,
                user,
                firstTarget,
                nextTarget,
            });
            return { status: 200 };
        }

        /* ---------- THẤT BẠI ---------- */
        const errLog = `Can't open new order for user ${user.email}`;
        handleError(errLog, "error", [response]);
        sendTelegramAdminMessage(errLog);
        return { status: 400 };
    } catch (err) {
        const errLog = `Can't open new order in handleOpenOrder for userId ${broker?.userId}: ${err}`;
        handleError(errLog, "error", [err]);
        return { status: 500 };
    }
};

type handleAfterOpenNewOrderType = {
    response: any;
    token: Token;
    strategyId: number;
    orderToken: string;
    user: User;
    firstTarget: Target;
    nextTarget: Target;
};

const handleAfterOpenNewOrder = async ({ response, orderToken, strategyId, token, user, firstTarget, nextTarget }: handleAfterOpenNewOrderType) => {
    writeLog([`Open root order successfully --- ${orderToken}`, { ...response }]);

    // Insert order to table
    const order = await insertOrder({ response, nextTargetId: nextTarget.id, token, strategyId, user });

    // Set stoploss
    const stoplossId = await newStoploss({ target: firstTarget, order, token });

    // set target's Storage
    let markPrice = calculateMarkPrice(nextTarget.targetPercent, order.entryPrice, order.side);
    targetStorageInstance.addTarget({ token: token.name, target: { orderId: order.orderId, markPrice, targetId: nextTarget.id, side: order.side, stoplossId } });

    // create interval token's price check
    intervalPriceOrderInstance.createIntervalPriceCheck(orderToken, token.name);

    // Send message to TELEGRAM
    const telegramMessage = telegramNewOrderPayload({
        entryTime: order.createdAt,
        entryPrice: order.entryPrice,
        orderId: order.orderId,
        stoplossPrice: calculateMarkPrice(firstTarget.stoplossPercent, order.entryPrice, order.side),
        targetPrice: markPrice,
        side: order.side,
    });
    await sendTelegramMessage(telegramMessage, user.telegramChatId);
};

export type userBudgets = {
    userId: number;
    budget: number;
    commissionPercent: number;
    qty: number;
};

type calculateOrderQtyType = {
    token: Token;
    strategyId: number;
    price: number;
    user: User;
    strategyBudgetPercent?: number;
};

export const calculateOrderQty = async ({ token, strategyId, price, user, strategyBudgetPercent }: calculateOrderQtyType) => {
    const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });

    let isSupriseThisToken = await prisma.userToken.findFirst({ where: { userId: user.id, tokenId: token.id } });
    if (isSupriseThisToken && strategy) {
        let budget = 0;
        if (strategyBudgetPercent) {
            budget = user.tradeBalance * (strategyBudgetPercent / 100); //Calculate budget per order
        } else {
            const strategiesCount = await countUserTokenStrategies(user, strategyId);

            budget = (user.tradeBalance * (strategy.contribution / 100)) / strategiesCount; //Calculate budget per order
        }

        const qty = roundQtyToNDecimal(budget / price, token.minQty) * token.leverage; //Calculate qty per order
        if (qty >= token.minQty) {
            return qty;
        }
    }
    return;
};

/**
 * This function will count how many tokens which user trade in strategy
 * Example: User trade BNB, ETH, BTC
 * BNB, ETH in strategy
 * Function will return 2
 */
const countUserTokenStrategies = async (user: User, strategyId: number): Promise<number> => {
    // Step 1: Get all tokens associated with the user
    const userTokens = await prisma.userToken.findMany({
        where: { userId: user.id },
        select: {
            tokenId: true,
        },
    });

    // Extract token IDs
    const tokenIds = (userTokens as UserToken[]).map((userToken) => userToken.tokenId).filter((tokenId) => tokenId !== null) as number[];

    // Step 2: Count the total number of strategies for those tokens
    const strategiesCount = await prisma.tokenStrategy.count({
        where: {
            tokenId: {
                in: tokenIds,
            },
            strategyId,
            strategy: {
                isActive: true,
            },
        },
    });
    return strategiesCount;
};

type InsertOrderType = {
    response: any;
    nextTargetId: number;
    token: Token;
    strategyId: number;
    user: User;
};

const insertOrder = async ({ response, nextTargetId, token, strategyId, user }: InsertOrderType): Promise<Order> => {
    const { entryPrice, qty, timestamp, side } = response;

    const markerFee = brokerInstancePool.getBroker(user.id)!.getMakerFee();

    const order = await prisma.order.create({
        data: {
            orderId: jsonbig.stringify(response.orderId).replace(/"/g, ""),
            side,
            timestamp,
            entryPrice,
            qty,
            budget: entryPrice * qty,
            status: "ACTIVE",
            currentTargetId: nextTargetId,
            tokenId: token.id,
            strategyId,
            fee: entryPrice * qty * markerFee,
            userId: user.id,
            leverage: token.leverage, // leverage of this order
        },
    });

    return order;
};

/* --------------------------------------------------------------------------*
 * When order closed => all stoploss are closed and calculated profit        *
 *---------------------------------------------------------------------------*/
let processCloseQueue = new Set<string>();
let processQueue = new Set<string>();

export const closeOrderAndStoploss = async (order: Order, token: Token, allowTrigger = true) => {
    if (!processCloseQueue.has(order.orderId)) {
        processCloseQueue.add(order.orderId);

        const tokenUSDT = token.name + token.stable;
        const side = order.side === "SELL" ? "BUY" : "SELL";
        const qty = order.qty;
        const payload = __payloadCloseOrder({ token: tokenUSDT, side, qty }, token.minQty);

        // 1. Close order
        const broker = brokerInstancePool.getBroker(order.userId);
        const response = await broker!.API_closeOrder(payload);

        if (response.success) {
            const markPrice = response.markPrice!;

            if (!processQueue.has(order.orderId)) {
                processQueue.add(order.orderId);
                await cancelStoplossAndUpdateOrder(order, token, markPrice);
                processQueue.delete(order.orderId);

                // Nếu cho phép mở thêm 1 lệnh
                if (allowTrigger) {
                    const strategy = await prisma.strategy.findUnique({ where: { id: order.strategyId } });
                    const last5Dcandles = await broker!.getLastNDayCandle(token.name, 6);
                    // Kiểm tra chỉ có parent strategy được phép mở thêm 1 lệnh
                    if (strategy && strategy.parentStrategy === null && last5Dcandles) {
                        const isAllGreen = last5Dcandles.slice(0, 5).every((candle: candleType) => candle.Close > candle.Open);
                        const isAllRed = last5Dcandles.slice(0, 5).every((candle: candleType) => candle.Close < candle.Open);

                        const rule = isAllGreen || isAllRed ? "FIVE_SAME_COLOR" : "DEFAULT";

                        const triggerStrategies = await prisma.strategy.findMany({
                            where: {
                                triggerRule: rule,
                                isActive: true,
                                parentStrategy: order.strategyId, // bảo đảm chỉ lấy strategy gốc
                            },
                        });

                        if (triggerStrategies.length > 0) {
                            let side = order.side;
                            if (triggerStrategies[0].direction === "OPPOSITE") {
                                if (order.side === "BUY") side = "SELL";
                                else side = "BUY";
                            }

                            setTimeout(async () => {
                                await openRootOrder({ token, strategy: triggerStrategies[0], side, forSpecifyUserId: order.userId });
                            }, 5000);
                        }
                    }
                }
            }
            processCloseQueue.delete(order.orderId);
            return { status: 200 };
        } else {
            const errorLog = `Can't cancel order id: ${order.orderId} - handleRootOrder`;
            sendTelegramAdminMessage(errorLog);
            writeLog([errorLog, response]);
            logging("error", errorLog);
            return { status: 400 };
        }
    }
};

/* -------------------------------------------------*
 * This function will close all order by token *
 *--------------------------------------------------*/
export const closeOrderManually = async (tokenName: string, markPrice: number, userId: number) => {
    const orders = await prisma.order.findMany({
        where: {
            status: "ACTIVE",
            token: {
                name: tokenName,
            },
            userId,
        },
        include: {
            token: true,
        },
    });

    const todo = orders.filter((order) => !processQueue.has(order.orderId));

    const tasks = todo.map(async (order) => {
        processQueue.add(order.orderId);
        try {
            await cancelStoplossAndUpdateOrder(order, order.token!, markPrice);
        } finally {
            processQueue.delete(order.orderId);
        }
    });

    await Promise.allSettled(tasks);
};

const cancelStoplossAndUpdateOrder = async (order: Order, token: Token, markPrice: number) => {
    // 1. Cancel all stoploss belong to this order
    await cancelStoplossByOrder(order, token.name + token.stable);

    // 2. Update order
    const updateOrder = await updateOrderAfterDone({ order, markPrice });

    // 3. Xoá target ra khỏi target storage
    targetStorageInstance.removeTarget({ orderId: order.orderId, token: token.name });

    // 4. Check if doesn't exitsts any order belongs to this token then we remove interval price check
    isCloseIntervalToken(token.name, token.stable);

    const userChatId = await prisma.user.findUnique({ where: { id: order.userId }, select: { telegramChatId: true } });

    // 5. Send message to telegram
    const telegramMessage = telegramHitTargetPayload({
        entryTime: updateOrder.updatedAt,
        entryPrice: order.entryPrice,
        orderId: order.orderId,
        executedPrice: markPrice,
        side: order.side,
    });

    if (userChatId) {
        await sendTelegramMessage(telegramMessage, userChatId.telegramChatId);
    }
};

type RecoverOrderParams = {
    symbol: string;
    side: "BUY" | "SELL";
    userId: number;
};

export const recoverLatestOpenOrder = async ({ symbol, side, userId }: RecoverOrderParams) => {
    const broker = brokerInstancePool.getBroker(userId);

    if (broker) {
        const hasPosition = await broker.API_checkHasOpenPosition(symbol);

        // Step 1
        if (!hasPosition) {
            console.log(`Error recoverLatestOpenOrder step 1 ${symbol}`);
            writeLog([`Error recoverLatestOpenOrder step 1 ${symbol} - No open position`]);
            return null;
        }

        // Step 2
        const { orderId } = await broker!.API_getRecentFilledOrder(symbol, side);
        if (!orderId) {
            return null;
        }
        const orderDetailRes = await broker!.API_verifyOrder(symbol, orderId);

        if (!orderDetailRes.success) {
            const log = `Error recoverLatestOpenOrder step 3 ${symbol}`;
            console.log(log);
            sendTelegramAdminMessage(log);
            writeLog([`Error recoverLatestOpenOrder step 3 ${symbol}`, orderDetailRes]);
            return null;
        }

        return orderDetailRes;
    } else {
        return null;
    }
};

export const updateOrderAfterDone = async ({ order, markPrice }: { order: Order; markPrice: number }) => {
    const profit = calculateProfit({
        side: order.side,
        entryPrice: order.entryPrice,
        markPrice,
        qty: order.qty,
    });

    const dummyBroker = brokerInstancePool.getBroker();
    const fee = order.fee + order.qty * markPrice * dummyBroker!.getMakerFee();
    const netProfit = profit - fee;

    const updateOrder = await prisma.order.update({
        where: { orderId: order.orderId },
        data: {
            status: "FINISHED",
            markPrice,
            netProfit,
            fee,
        },
    });

    try {
        const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { tradeBalance: true } });
        if (user) {
            await prisma.user.update({ where: { id: order.userId }, data: { tradeBalance: user.tradeBalance + netProfit } });
        }
    } catch (err) {
        handleError(`User not found to update tradeBalance - orderId: ${order.orderId}`, "error", [err]);
    }

    return updateOrder;
};
