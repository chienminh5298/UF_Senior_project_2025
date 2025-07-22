import jsonbig from "json-bigint";

import { sendTelegramAdminMessage, sendTelegramMessage, telegramHitStoplossPayload } from "@src/utils/telegram";
import { calculateEarnAndProfitForEachUser } from "@src/handleOrders/handleUser";
import { calculateProfit, handleError, isCloseIntervalToken } from "@src/utils";
import { Order, Target, Token } from "@prisma/client";
import { API_cancelStoploss, API_newStoploss } from "@src/api/binance";
import { __payloadNewStoploss } from "@src/payload/binance";
import { logging, writeLog } from "@src/utils/log";
import prisma from "@root/prisma/database";
import { setting } from "@root/setting";
import targetStorageInstance from "@src/classes/targetStorage";

/* --------------------------------*
 * This function will set stoploss *
 *---------------------------------*/
export const newStoploss = async (target: Target, order: Order, token: Token) => {
    const responseCode = await setStoploss({ token, order, target });

    //Retry 1 more time 3s after
    if (responseCode !== 200) {
        setTimeout(async () => {
            await setStoploss({ token, order, target });
        }, 3000);
    }

    // If failed to set stoploss should close order
};

type SetStoplossType = {
    token: Token;
    order: Order;
    target: Target;
};

const setStoploss = async ({ token, order, target }: SetStoplossType) => {
    const payload = __payloadNewStoploss({ token, order, stoplossPercent: target.stoplossPercent });
    const response = await API_newStoploss(payload);
    if (response.status === 200) {
        const data = response.data;

        writeLog([`Open stoploss order successfully --- ${token.name + token.stable}`, data]);

        // update stoplossOrderId for order
        await prisma.order.update({
            where: {
                orderId: order.orderId,
            },
            data: {
                stoplossOrderId: jsonbig.stringify(data.orderId),
            },
        });
    } else {
        const error = `Can't open new stoploss for root order id: ${order.orderId} - target id: ${target.id} - handleSubOrder`;
        sendTelegramAdminMessage(error);
        handleError(error, "error", [response]);
        writeLog([error, response]);
    }
    return response.status;
};

/* ----------------------------------*
 * Function handle stoploss executed *
 *-----------------------------------*/
export const excutedStoploss = async (orderId: string, markPrice: number) => {
    const order = await prisma.order.findFirst({ where: { stoplossOrderId: orderId } });

    if (order) {
        const profit = calculateProfit({
            side: order.side,
            entryPrice: order.entryPrice,
            markPrice,
            qty: order.qty,
        });

        writeLog([`Stoploss executed --- ${order.orderId}`, order]);

        // 2. Update order
        const fee = order.qty * markPrice * setting.BINANCE.TAKER_FEE + order.fee;
        const updateRootOrder = await prisma.order.update({
            where: { orderId: order.orderId },
            data: {
                status: "FINISHED",
                markPrice,
                netProfit: profit - fee,
                fee: fee,
            },
        });

        targetStorageInstance.removeTarget(order.orderId);

        let token = await prisma.token.findUnique({ where: { id: order.tokenId } });
        isCloseIntervalToken(token!);

        // 3. Update profit & earn
        await calculateEarnAndProfitForEachUser(updateRootOrder);

        // 4. Send message to telegram
        const telegramMessage = telegramHitStoplossPayload({
            entryTime: updateRootOrder.updatedAt,
            orderId: updateRootOrder.orderId,
            stoplossPrice: updateRootOrder.markPrice!,
            entryPrice: updateRootOrder.entryPrice,
            side: updateRootOrder.side,
        });
        await sendTelegramMessage(telegramMessage);
    }
};

/* -----------------------------------------------*
 * Function will cancel all stoploss by order *
 *------------------------------------------------*/
export const cancelStoplossByOrder = async (order: Order, token: string) => {
    const response = await cancelStoplosses({ token, order });

    // Retry 1 more time after 3s
    if (response !== 200) {
        setTimeout(async () => {
            await cancelStoplosses({ token, order });
        }, 3000);
    }
};

type CancelStoplossesType = {
    token: string;
    order: Order;
};

export const cancelStoplosses = async ({ token, order }: CancelStoplossesType) => {
    let response = await API_cancelStoploss({ token, orderIds: [order.stoplossOrderId!] });

    if (response.status !== 200) {
        const log = `Can't cancel sub order for root order id: ${order.orderId} - handleRootOrder`;
        sendTelegramAdminMessage(log);
        logging("error", log);
        writeLog([log, response]);
        return 400;
    } else {
        await prisma.order.update({ where: { orderId: order.orderId }, data: { stoplossOrderId: null } });
    }
    return 200;
};
