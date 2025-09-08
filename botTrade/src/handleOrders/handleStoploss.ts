import { sendTelegramAdminMessage, sendTelegramMessage, telegramHitStoplossPayload, telegramHitTargetPayload } from "@src/utils/telegram";
import { closeOrderAndStoploss, updateOrderAfterDone } from "@src/handleOrders/handleOrder";
import brokerInstancePool from "@src/classes/brokerInstancePool";
import targetStorageInstance from "@src/classes/targetStorage";
import { calculateMarkPrice, handleError, isCloseIntervalToken, roundQtyToNDecimal, roundStopPriceTo2Decimals } from "@src/utils";
import { Order, Target, Token } from "@prisma/client";
import { logging, writeLog } from "@src/utils/log";
import prisma from "@root/prisma/database";
import jsonbig from "json-bigint";
import { __payloadNewStoplossType, CancelStoplossesType, NewStoploss, SetStoplossType } from "@root/type";

/* --------------------------------*
 * This function will set stoploss *
 *---------------------------------*/

export const newStoploss = async ({ target, order, token, maxRetry = 3, delayMs = 3000 }: NewStoploss): Promise<string | null> => {
    for (let attempt = 1; attempt <= maxRetry; attempt++) {
        const stoplossId = await setStoploss({ token, order, target });
        if (stoplossId) return stoplossId; // ✅ Success

        if (attempt < maxRetry) {
            logging("warn", `Retry setStoploss (${attempt}/${maxRetry}) for order ${order.orderId}`);
            await new Promise((r) => setTimeout(r, delayMs)); // ⏳ Wait before retry
        }
    }

    const errLog = `Failed to set stoploss for order ${order.orderId} after ${maxRetry} attempts`;
    sendTelegramAdminMessage(errLog);
    handleError(errLog, "error", [order]);

    // Đóng order nếu như không set được stoploss
    await closeOrderAndStoploss(order, token);

    return null;
};

const setStoploss = async ({ token, order, target }: SetStoplossType): Promise<string | null> => {
    const broker = brokerInstancePool.getBroker(order.userId);
    if (!broker) {
        handleError(`No broker for user ${order.userId}`, "error", [brokerInstancePool.getPool]);
        return null;
    }

    const payload: __payloadNewStoplossType = {
        symbol: token.name + token.stable,
        qty: roundQtyToNDecimal(order.qty, token.minQty),
        side: order.side === "short" ? "BUY" : ("SELL" as "SELL" | "BUY"),
        stopPrice: roundStopPriceTo2Decimals(calculateMarkPrice(target.stoplossPercent, order.entryPrice, order.side)),
        type: "STOP_MARKET",
    };

    const response = await broker.API_newStoploss(payload);
    if (response.success) {
        const orderId = response.orderId;
        writeLog([`Open stoploss successfully — ${token.name + token.stable}`, orderId]);

        const stoplossId = jsonbig.stringify(orderId).replace(/"/g, "");
        await prisma.order.update({
            where: { orderId: order.orderId },
            data: { stoplossOrderId: stoplossId },
        });

        return stoplossId;
    }

    const err = `Can't open stoploss for order ${order.orderId} (target ${target.id})`;
    writeLog([err, response]);
    handleError(err, "error", [response]);
    return null;
};

/* ----------------------------------*
 * Function handle stoploss executed *
 *-----------------------------------*/
let excutedStoplossSet = new Set<string>();

export const excutedStoploss = async (orderId: string, markPrice: number) => {
    if (excutedStoplossSet.has(orderId)) return;

    excutedStoplossSet.add(orderId);
    const order = await prisma.order.findFirst({
        where: { stoplossOrderId: orderId },
        include: {
            token: {
                select: {
                    name: true,
                    stable: true,
                },
            },
        },
    });

    if (!order || !order.token) {
        handleError(`Can't find stoploss stoplossId - ${orderId} executed in database.`, "error", []);
        return;
    }

    writeLog([`Stoploss executed --- ${order.orderId}`, order]);

    // 2. Update order
    const updateOrder = await updateOrderAfterDone({ order, markPrice });

    targetStorageInstance.removeTarget({ orderId: order.orderId, token: order.token.name });

    isCloseIntervalToken(order.token.name, order.token.stable);

    const userChatId = await prisma.user.findUnique({ where: { id: order.userId }, select: { telegramChatId: true } });

    // 4. Send message to telegram
    let telegramMessage;
    if (updateOrder.netProfit < 0) {
        telegramMessage = telegramHitStoplossPayload({
            entryTime: updateOrder.updatedAt,
            orderId: updateOrder.orderId,
            stoplossPrice: updateOrder.markPrice!,
            entryPrice: updateOrder.entryPrice,
            side: updateOrder.side,
        });
    } else {
        telegramMessage = telegramHitTargetPayload({
            entryTime: updateOrder.updatedAt,
            orderId: updateOrder.orderId,
            entryPrice: updateOrder.entryPrice,
            side: updateOrder.side,
            executedPrice: updateOrder.markPrice!,
        });
    }

    if (userChatId) {
        await sendTelegramMessage(telegramMessage, userChatId.telegramChatId);
    }

    excutedStoplossSet.delete(orderId);
};

/* -----------------------------------------------*
 * Function will cancel stoploss by order         *
 *------------------------------------------------*/
export const cancelStoplossByOrder = async (order: Order, token: string) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const ok = await cancelStoplosses({ token, order });
        if (ok) return true; // ✅ Success

        if (attempt < 3) {
            const log = `Retry cancel stoploss (${attempt}/3) for order ${order.orderId} - stoplossId ${order.stoplossOrderId}`;
            logging("warn", log);
            writeLog([log]);
            await new Promise((r) => setTimeout(r, 3000)); // ⏳ Wait before retry
        }
    }
};

export const cancelStoplosses = async ({ token, order }: CancelStoplossesType) => {
    if (!order.stoplossOrderId) return false;

    const broker = brokerInstancePool.getBroker(order.userId);
    if (!broker) return false;

    try {
        const response = await broker.API_cancelStoploss({
            symbol: token,
            orderIds: [order.stoplossOrderId],
        });

        if (response.status === 200) {
            await prisma.order.update({
                where: { orderId: order.orderId },
                data: { stoplossOrderId: null },
            });
            return true;
        }
        return false;
    } catch (err) {
        handleError(`Can't cancel stoploss for order id: ${order.orderId} - handleRootOrder`, "error", [err]);
        return false;
    }
};
