import "dotenv/config";
import "module-alias/register";

import { checkExpireVouchers, createTokenPriceInterval } from "@src/utils";
import { checkAccountNotPayBill, checkGenerateBill } from "@src/utils/bill";
import { loadTargetToStorage } from "@src/handleOrders/handleTarget";
import express, { NextFunction, Request, Response } from "express";
import brokerInstancePool from "@src/classes/brokerInstancePool";
import prisma, { connectDatabase } from "@root/prisma/database";
import handleBacktestRoute from "@src/routes/backtest/backtest";
import handleOrderRoute from "@src/routes/handleOrder";
import { mutationUpdateData } from "@root/src/API/ultil";
import { isAuthorization } from "@src/middleware";
import { logging } from "@src/utils/log";
// import { loadDEK } from "@src/utils/aws";
import { Token } from "@prisma/client";
import { checkStrategies } from "@src/strategies";

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

    if (process.env.isProduction) {
        // Load target to storage
        await loadTargetToStorage();

        // Check price of current open order
        await createTokenPriceInterval();
    }

    // Load broker pool
    await brokerInstancePool.loadPool();

    // Refresh pool
    brokerInstancePool.refreshPool();

    if (process.env.isProduction) {
        // await loadDEK(); // Get data key from KMS to decrypt api

        setInterval(async () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const second = now.getSeconds();
            // logging("info", `hour:${hour} - minute: ${minute} - second: ${second}`);
            if (hour === 0 && minute === 0 && second === 5) {
                logging("info", `hour:${hour} - minute: ${minute} - second: ${second}`);
                await checkExpireVouchers();
                await checkGenerateBill();
                await checkAccountNotPayBill();
                await checkTokens();
            }
        }, 1000);
    }
};

startServer();

const checkTokens = async () => {
    let tokens: Token[] = await prisma.token.findMany();
    tokens.forEach(async (token) => await checkToken(token));
};

const checkToken = async (token: Token) => {
    // Goi 1 api den AWS Lamda de update token
    await mutationUpdateData(token.name);

    // Check stratergy for open order
    await checkStrategies(token);
};
