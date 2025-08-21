import { closeOrderAndStoploss } from "@src/handleOrders/handleOrder";
import { cancelStoplosses } from "@src/handleOrders/handleStoploss";
import brokerInstancePool from "@src/classes/brokerInstancePool";
import { __payloadNewStoploss } from "@src/payload/binance";
import express, { NextFunction, Response } from "express";
import { CustomRequest } from "@src/middleware";
import { Order, Token } from "@prisma/client";
import prisma from "@root/prisma/database";
import { writeLog } from "@src/utils/log";
import { handleError } from "@src/utils";
import jsonbig from "json-bigint";

const router = express.Router();

router.post("/cancelStoploss", async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { token, order } = req.body;

    try {
        const status = await cancelStoplosses({ token, order });
        if (status) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ message: "Can't cancel this stoploss" });
        }
    } catch {
        console.log("Error route POST /backtest/handleOrder/cancelStoploss");
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/setStoploss", async (req: CustomRequest, res: Response, next: NextFunction) => {
    let { order, stoplossPercent }: { order: Order & { token: Token | null }; stoplossPercent: number } = req.body;

    if (!order || !order.token) {
        res.status(400).json({ message: "Invalid data" });
        return;
    }

    try {
        const payload = __payloadNewStoploss({ order: order, token: order.token, stoplossPercent });

        const broker = brokerInstancePool.getBroker(order.userId);
        const response = await broker!.API_newStoploss(payload);
        if (response) {
            const orderId = response.orderId;

            // update stoplossOrderId for order
            await prisma.order.update({
                where: {
                    orderId: order.orderId,
                },
                data: {
                    stoplossOrderId: jsonbig.stringify(orderId).replace(/"/g, ""),
                },
            });

            res.status(200).json({ success: true });
        } else {
            const error = `Can't open new stoploss for order id: ${order.orderId} - stoploss id: Manual stoploss - handleSubOrder`;
            handleError(error, "error", [response]);
            writeLog([error, response]);
        }
    } catch (err) {
        handleError(`Error route POST /backtest/handleOrder/setStoploss`, "error", [err]);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/closeOrder", async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { order, token }: { order: Order; token: Token } = req.body;
    try {
        const responseCancel = await closeOrderAndStoploss(order, token);
        if (responseCancel && responseCancel.status === 200) {
            writeLog([`Close order manualy - orderId ${order.orderId} - token ${token.name} - userId ${order.userId} `]);
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ message: "Bad request" });
        }
    } catch (err) {
        const log = `Error route POST /backtest/handleOrder/closeOrder ${order.orderId}`;
        console.log(log);
        handleError(log, "error", [err, order]);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
