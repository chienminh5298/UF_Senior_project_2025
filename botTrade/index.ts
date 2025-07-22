import "dotenv/config";
import "module-alias/register";

import { checkExpireVouchers, createTokenPriceSocket, updateUserAsset } from "@src/utils";
import express, { NextFunction, Request, Response } from "express";
import prisma, { connectDatabase } from "@root/prisma/database";
import handleBacktestRoute from "@src/routes/backtest/backtest";
import { createOpenOrderSocket } from "@src/socket/binance";
import handleOrderRoute from "@src/routes/handleOrder";
import { mutationUpdateData } from "@src/API/ultil";
import { checkStrategies } from "@src/utils/process";
import { isAuthorization } from "@src/middleware";
import { adjustLeverage } from "@src/api/binance";
import ListenKey from "@src/classes/listenKey";
import Timestamp from "@src/classes/timestamp";
import { logging } from "@src/utils/log";
import { Token } from "@prisma/client";

const server = express();

// body parser
server.use(express.json());

// CORS
server.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(200).end();
    } else {
        next();
    }
});

// ROUTES
server.use("/backtest", handleBacktestRoute);
server.use("/order", isAuthorization, handleOrderRoute);

server.listen(parseInt(process.env.SERVER_PORT || "3000", 10));

// START SERVER

const startServer = async () => {
    // Connect & define database
    await connectDatabase();

    // Get listen key
    await new ListenKey().getListenKey();

    // Get timestamp
    new Timestamp().getTimestamp();

    // Create socket to listen if order status changed
    createOpenOrderSocket();

    // Check price of current open order
    await createTokenPriceSocket();

    setInterval(async () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();

        // logging("info", `hour:${hour} - minute: ${minute} - second: ${second}`);
        if (hour === 0 && minute === 0 && second === 5) {
            logging("info", `hour:${hour} - minute: ${minute} - second: ${second}`);

            await updateUserAsset();

            await checkExpireVouchers();

            await checkTokens();
        }
    }, 1000);
};

startServer();

const checkTokens = async () => {
    let tokens: Token[] = await prisma.token.findMany();
    tokens.forEach(async (token) => await checkToken(token));
};

const checkToken = async (token: Token) => {
    // set leverage to 1
    await adjustLeverage(token.name + token.stable, 1);

    // Call an API to AWS to update token data
    await mutationUpdateData(token.name);

    // Check stratergy for open order
    await checkStrategies(token);
};
