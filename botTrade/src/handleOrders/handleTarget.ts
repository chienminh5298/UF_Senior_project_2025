import { sendTelegramAdminMessage, sendTelegramMessage, telegramMoveStoplossPayload } from "@src/utils/telegram";
import { cancelStoplossByOrder, newStoploss } from "@src/handleOrders/handleStoploss";
import targetStorageInstance, { TargetType } from "@src/classes/targetStorage";
import { closeOrderAndStoploss } from "@src/handleOrders/handleOrder";
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

export const checkTarget = async (token: string, price: number) => {
    let orderTargets = Object.values(targetStorageInstance.getOrderTargetOfToken(token));

    // Lọc lấy ra các orderTarget chưa được xử lý
    const todo = orderTargets.filter((t) => !processCheckTargetInstance.has(t.orderId));

    // Lấy một mảng tasks
    const tasks = todo.map(async (orderTarget) => {
        processCheckTargetInstance.add(orderTarget.orderId);
        try {
            await compareWithTarget(orderTarget, price);
        } finally {
            processCheckTargetInstance.delete(orderTarget.orderId);
        }
    });

    // Check parallel multiple accounts
    await Promise.allSettled(tasks);
};

const compareWithTarget = async (orderTarget: TargetType, price: number) => {
    if ((orderTarget.side === "BUY" && price > orderTarget.markPrice) || (orderTarget.side === "SELL" && price < orderTarget.markPrice)) {
        const order = await prisma.order.findUnique({ where: { orderId: orderTarget.orderId }, include: { token: true } });

        if (!order || !order.token) {
            handleError(`Order in target storage but missing in Database - orderId ${orderTarget.orderId}`, "error", [orderTarget]);
            return;
        }

        const currentTarget = await prisma.target.findUnique({ where: { id: order.currentTargetId! } });
        const nextTarget = await getNextTarget(currentTarget, order.token!.id, order.strategyId);

        if (nextTarget && currentTarget) {
            const stoplossId = await moveTarget(order, currentTarget, nextTarget.id, order.token!);

            // Update target's storage - set next target
            let markPrice = calculateMarkPrice(nextTarget.targetPercent, order.entryPrice, order.side);
            targetStorageInstance.updateTarget({ token: order.token.name, newTarget: { orderId: orderTarget.orderId, markPrice, side: orderTarget.side, targetId: nextTarget.id, stoplossId } });
        } else {
            // Neu khong con target => Target cuoi cung
            await closeOrderAndStoploss(order, order.token!);
            writeLog([`Close order (hit last target - ${currentTarget?.targetPercent}%) orderId ${order.orderId} - token ${order.token!.name}`]);
        }
    }
};

/* --------------------------------------------------------------------------------------------*
 * This function will load target of orders to storage                                         *
 * When we start server, storage is empty => We need load target of open orders to storage     *
 *---------------------------------------------------------------------------------------------*/
export const loadTargetToStorage = async () => {
    let orders: (Order & { target: { id: number; targetPercent: number } | null } & { token: { name: string } | null })[] = await prisma.order.findMany({
        where: {
            status: "ACTIVE",
        },
        include: {
            token: {
                select: { name: true },
            },
            target: {
                select: {
                    id: true,
                    targetPercent: true,
                },
            },
        },
    });

    await Promise.allSettled(
        orders.map(async (order) => {
            if (!order.currentTargetId || !order.target || !order.token) {
                await sendTelegramAdminMessage(`Order id: ${order.orderId} doesn't have STOPLOSS!!!`);
                return;
            }

            let markPrice = calculateMarkPrice(order.target.targetPercent, order.entryPrice, order.side);

            targetStorageInstance.addTarget({ token: order.token.name, target: { targetId: order.target.id, markPrice, orderId: order.orderId, side: order.side, stoplossId: order.stoplossOrderId } });
        })
    );
};

/* ----------------------------------------------------------------------------------*
 * This function will return the next target                                         *
 * If have not next target it's mean order reach take profit (Reach the last target) *
 *-----------------------------------------------------------------------------------*/
export const getNextTarget = async (currentTarget: Target | null, tokenId: number, strategyId: number) => {
    if (!currentTarget) {
        logging("error", `Can't get current target - getNextTarget - handleTarget`);
        return null;
    }

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
};

/* --------------------------------------------------------------------------*
 * This function will update next target for order                           *
 * It also cancel all stoploss and then place a new stoploss                 *
 *---------------------------------------------------------------------------*/
export const moveTarget = async (order: Order, target: Target, nextTargetId: number, token: Token): Promise<string | null> => {
    const orderToken = token.name + token.stable;

    try {
        // 1. Update root order
        await prisma.order.update({
            where: {
                orderId: order.orderId,
            },
            data: { currentTargetId: nextTargetId },
        });

        // 2. Cancel all stoploss by order
        await cancelStoplossByOrder(order, orderToken);

        // 4. Set new stoploss
        const stoplossId = await newStoploss({ target, order, token });

        // 5. Send message to telegram

        const userChatId = await prisma.user.findUnique({ where: { id: order.userId }, select: { telegramChatId: true } });

        const telegramMessage = telegramMoveStoplossPayload({
            entryTime: new Date(),
            orderId: order.orderId,
            targetPrice: calculateMarkPrice(target.targetPercent, order.entryPrice, order.side),
            stoplossPrice: calculateMarkPrice(target.stoplossPercent, order.entryPrice, order.side),
            side: order.side,
        });

        if (userChatId) {
            await sendTelegramMessage(telegramMessage, userChatId.telegramChatId);
        }

        writeLog([`Move target --- ${orderToken} => ${target.targetPercent}%`]);

        return stoplossId;
    } catch (error) {
        const log = `Can't cancel stoploss for order id: ${order.orderId} - moveTarget - handleTarget`;
        sendTelegramAdminMessage(log);
        handleError(log, "error", [error]);

        return null;
    }
};
