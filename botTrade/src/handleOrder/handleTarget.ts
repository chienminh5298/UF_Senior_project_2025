import { sendTelegramAdminMessage, sendTelegramMessage, telegramMoveStoplossPayload } from "@src/utils/telegram";
import { cancelStoplossByOrder, newStoploss } from "@src/handleOrders/handleStoploss";
import { closeOrderAndStoploss } from "@src/handleOrders/handleOrder";
import targetStorageInstance from "@src/classes/targetStorage";
import { calculateMarkPrice, handleError } from "@src/utils";
import { Order, Target, Token } from "@prisma/client";
import { logging, writeLog } from "@src/utils/log";
import prisma from "@root/prisma/database";

/* ---------------------------------------------------------------------------------------------------*
 * This function will compare market price VS target price to check if open order reach target or not *
 * If reach => move to next target or close open order and take profit                                *
 * If not reach => do nothing                                                                         *
 *----------------------------------------------------------------------------------------------------*/
let processCheckTargetInstance = new Set<string>();
export const checkTarget = async (tokenId: number, price: number) => {
    let orders = await getRootordersToCheckTarget(tokenId);

    for (const order of orders) {
        if (!processCheckTargetInstance.has(order.orderId)) {
            processCheckTargetInstance.add(order.orderId);
            await compareWithTarget(order, price);
            processCheckTargetInstance.delete(order.orderId);
        }
    }
};

const getRootordersToCheckTarget: (tokenId: number) => Promise<(Order & { token: Token | null })[]> = async (tokenId) => {
    const orders = await prisma.order.findMany({
        where: {
            tokenId: tokenId,
            status: "ACTIVE",
        },
        include: {
            token: true,
        },
    });
    return orders;
};

const compareWithTarget = async (order: Order & { token: Token | null }, price: number) => {
    let targetStorage = targetStorageInstance.getTarget(order.orderId);

    if (targetStorage) {
        if ((order.side === "long" && price > targetStorage.markPrice) || (order.side === "short" && price < targetStorage.markPrice)) {
            const nextTarget = await getNextTarget(order.currentTargetId!, order.token!.id, order.strategyId);
            const currentTarget = await prisma.target.findUnique({ where: { id: order.currentTargetId! } });
            if (nextTarget && currentTarget) {
                await moveTarget(order, currentTarget, nextTarget.id, order.token!);

                // Update target's storage - set next target
                let markPrice = calculateMarkPrice(nextTarget.targetPercent, order.entryPrice, order.side);
                targetStorageInstance.updateTarget(order.orderId, { targetId: nextTarget.id, markPrice });
            } else {
                // Neu khong con target => Target cuoi cung
                await closeOrderAndStoploss(order, order.token!);
            }
        }
    }
};

/* --------------------------------------------------------------------------------------------*
 * This function will load target of orders to storage                                         *
 * When we start server, storage is empty => We need load target of open orders to storage *
 *---------------------------------------------------------------------------------------------*/
export const loadTargetToStorage = async (tokenId: number) => {
    let orders: Order[] = await prisma.order.findMany({
        where: {
            tokenId: tokenId,
            status: "ACTIVE",
        },
    });

    orders.forEach(async (order) => await loadTargetOfOrder(order));
};

const loadTargetOfOrder = async (order: Order) => {
    if (order.currentTargetId) {
        let target = await prisma.target.findUnique({ where: { id: order.currentTargetId! } });
        if (target) {
            let markPrice = calculateMarkPrice(target.targetPercent, order.entryPrice, order.side);

            targetStorageInstance.addTarget(order.orderId, { targetId: target.id, markPrice });
        }
    } else {
        await sendTelegramAdminMessage(`Order id: ${order.orderId} doesn't have STOPLOSS!!!`);
    }
};

/* ----------------------------------------------------------------------------------*
 * This function will return the next target                                         *
 * If have not next target it's mean order reach take profit (Reach the last target) *
 *-----------------------------------------------------------------------------------*/
export const getNextTarget = async (currentTargetId: number, tokenId: number, strategyId: number) => {
    let currentTarget = await prisma.target.findUnique({ where: { id: currentTargetId } });
    if (currentTarget) {
        const nextTarget = await prisma.target.findFirst({
            where: {
                tokenId: tokenId,
                strategyId: strategyId,
                targetPercent: {
                    gt: currentTarget.targetPercent, // Use gt for "greater than"
                },
            },
            orderBy: {
                targetPercent: "asc", // Order by percent in ascending order
            },
        });
        return nextTarget;
    } else {
        logging("error", `Can't get current target - getNextTarget - handleTarget`);
    }
    return null;
};

/* --------------------------------------------------------------------------*
 * This function will update next target for order                           *
 * It also cancel all stoploss and then place a new stoploss                 *
 *---------------------------------------------------------------------------*/
export const moveTarget = async (order: Order, target: Target, nextTargetId: number, token: Token) => {
    const orderToken = token.name + token.stable;

    try {
        // 1. Update root order
        await prisma.order.update({
            where: {
                orderId: order.orderId,
            },
            data: { currentTargetId: nextTargetId },
        });

        console.log(`move target: ${order.id}`);
        // 2. Cancel all stoploss by order
        await cancelStoplossByOrder(order, orderToken);

        // 4. Set new stoploss
        await newStoploss(target, order, token);

        // 5. Send message to telegram
        const telegramMessage = telegramMoveStoplossPayload({
            entryTime: new Date(),
            orderId: order.orderId,
            targetPrice: calculateMarkPrice(target.targetPercent, order.entryPrice, order.side),
            stoplossPrice: calculateMarkPrice(target.stoplossPercent, order.entryPrice, order.side),
            side: order.side,
        });
        await sendTelegramMessage(telegramMessage);

        writeLog([`Move target --- ${orderToken} => ${target.targetPercent}%`]);
    } catch (error) {
        const log = `Can't cancel sub order for root order id: ${order.orderId} - moveTarget - handleTarget`;
        sendTelegramAdminMessage(log);
        handleError(log, "error", [error]);
    }
};
