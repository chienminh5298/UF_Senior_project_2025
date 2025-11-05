import express, { NextFunction, Response } from "express";
import { getData1YearCandle } from "@root/src/API/ultil";
import { CustomRequest } from "@src/middleware";
import { Target, Token } from "@prisma/client";
import prisma from "@root/prisma/database";
import { BacktestCandleType, BacktestChartCandleType, BacktestCreateNewOrderType, BacktestLogicType, BacktestOrderType } from "@root/type";

const router = express.Router();

let tokenDataCache: {
    [token: string]: {
        [year: string]: {};
    };
} = {};

let simulateCache: {
    [token: string]: {
        [year: string]: BacktestChartCandleType;
    };
} = {};

setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    if (hour === 0 && minute === 0 && second === 10) {
        tokenDataCache = {};
        delete simulateCache[now.getFullYear()];
    }
}, 1000);

type IndexedCandle = BacktestCandleType & { ts: number };

function prepareCandles(data: { [k: string]: BacktestCandleType }): IndexedCandle[] {
    return Object.values(data)
        .map((c) => ({ ...c, ts: Date.parse(c.Date) }))
        .sort((a, b) => a.ts - b.ts);
}

function getBucketKey(candleDate: string, timeFrame: "1h" | "4h" | "1d"): string {
    const d = new Date(candleDate);
    if (timeFrame === "1d") {
        d.setUTCHours(0, 0, 0, 0);
    } else {
        d.setUTCMinutes(0, 0, 0);
        if (timeFrame === "4h") {
            const h = d.getUTCHours();
            d.setUTCHours(Math.floor(h / 4) * 4);
        }
    }
    return d.toISOString();
}

function aggregateToMap(allCandles: IndexedCandle[], timeFrame: "1h" | "4h" | "1d") {
    const map: Record<string, BacktestCandleType> = {};
    for (const c of allCandles) {
        const key = getBucketKey(c.Date, timeFrame);
        if (!map[key]) {
            map[key] = { Date: key, Open: c.Open, High: c.High, Low: c.Low, Close: c.Close, Volume: c.Volume };
        } else {
            const agg = map[key];
            agg.High = Math.max(agg.High, c.High);
            agg.Low = Math.min(agg.Low, c.Low);
            agg.Close = c.Close;
            agg.Volume += c.Volume;
        }
    }
    return map;
}
router.post("/", async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const { token, year, budget, strategyId }: { token: string; year: number; budget: number; strategyId: number } = req.body;
        let yearData = {};

        // Check if token exists in cache
        if (tokenDataCache[token]?.[year]) {
            yearData = tokenDataCache[token][year];
        } else {
            const queryData = await getData1YearCandle(token, year);

            if (queryData.status === 200) {
                yearData = queryData.data;

                // Cache
                tokenDataCache[token] = tokenDataCache[token] || {};
                tokenDataCache[token][year] = yearData;
            } else {
                return res.status(400).json({ message: "Invalid token or year" });
            }
        }

        const queryToken = await prisma.token.findUnique({ where: { name: token } });

        if (simulateCache[token]?.[year] && queryToken) {
            return res.status(200).json({ message: "Backtest done", result: simulateCache[token]?.[year], minQty: queryToken.minQty, leverage: queryToken.leverage });
        }

        const result = queryToken ? await backtestLogic({ strategyId, data: yearData, token: queryToken, timeFrame: "1d" }) : {};

        // Cache
        simulateCache[token] = simulateCache[token] || {};
        simulateCache[token][year] = result;

        return res.status(200).json({ message: "Backtest done", result: result, minQty: queryToken?.minQty, leverage: queryToken?.leverage });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;

const checkIsNewCandle = (UTCstring: string, timeFrame: "1h" | "4h" | "1d") => {
    const date = new Date(UTCstring);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    if (timeFrame === "1h" && minutes === 0) return true;
    if (timeFrame === "4h" && hours % 4 === 0 && minutes === 0) return true;
    if (timeFrame === "1d" && hours === 0 && minutes === 0) return true;
    return false;
};

const getMarkPRice = (percent: number, side: "BUY" | "SELL", entryPrice: number) => {
    if (side === "BUY") {
        return entryPrice + (percent * entryPrice) / 100;
    } else {
        return entryPrice - (percent * entryPrice) / 100;
    }
};

const randomId = () => Math.floor(100000000 + Math.random() * 900000000);

export const backtestLogic = async ({ strategyId, data, token, timeFrame }: BacktestLogicType) => {
    const allCandles = prepareCandles(data);

    let chartData = aggregateToMap(allCandles, timeFrame);

    const sortedBucketKeysChartData = Object.keys(chartData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const chartArr = Object.values(chartData).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    const dataKey = Object.keys(data);
    const dataValues = Object.values(data);
    let openOrder: { [orderId: number]: BacktestOrderType } = {};
    let response: BacktestChartCandleType = {};

    const getLastFiveCandle = (pivotUTC: string) => {
        const pivotKey = getBucketKey(pivotUTC, timeFrame);
        const idx = sortedBucketKeysChartData.indexOf(pivotKey);
        if (idx === -1 || idx < 5) {
            // Không tìm thấy pivotKey hoặc không đủ dữ liệu trước pivot
            return "MIXED";
        }
        // Bỏ mọi nến 5 m **>= pivot** (chỉ lấy dữ liệu trước pivot)
        const series = chartArr.slice(idx - 5, idx);
        const allGreen = series.every((c) => c.Close > c.Open);
        if (allGreen) return "GREEN";

        const allRed = series.every((c) => c.Close < c.Open);
        if (allRed) return "RED";

        return "MIXED";
    };

    const strategy = await prisma.strategy.findUnique({
        where: { id: strategyId },
        include: {
            targets: {
                where: { tokenId: token.id },
                orderBy: {
                    targetPercent: "asc",
                },
            },
        },
    });

    const triggerStrategies = await prisma.strategy.findMany({
        where: { parentStrategy: strategyId },
        include: {
            targets: {
                where: { tokenId: token.id },
                orderBy: {
                    targetPercent: "asc",
                },
            },
        },
    });

    const strategyTargets: Target[] = strategy?.targets || [];
    const triggerDefaultTargets: Target[] = triggerStrategies[0].targets || [];

    const getPrevCandle = (candledate: string) => {
        const bucketKey = getBucketKey(candledate, timeFrame);
        const idx = sortedBucketKeysChartData.indexOf(bucketKey);
        if (idx === -1 || idx === 0) {
            return null;
        }
        return chartData[sortedBucketKeysChartData[idx - 1]];
    };

    const processCreateNewCandleOrder = (candle: BacktestCandleType) => {
        const prevCandle = getPrevCandle(candle.Date);

        if (prevCandle && strategy) {
            let side: "BUY" | "SELL" = "BUY";
            if (prevCandle.Close > prevCandle.Open) {
                if (strategy.direction === "SAME") side = "BUY";
                else side = "SELL";
            } else {
                if (strategy.direction === "SAME") side = "SELL";
                else side = "BUY";
            }

            createNewOrder({ candle, entryPrice: candle.Open, isTrigger: false, side, strategyId: strategy.id });
        }
    };

    const checkHitTarget = (candle: BacktestCandleType) => {
        for (const orderId in openOrder) {
            const order = openOrder[orderId];

            let targets: Target[] = order.targets;

            const markPrice = getMarkPRice(targets[order.stoplossIdx + 1].targetPercent, order.side, order.entryPrice);

            if ((order.side === "BUY" && candle.High >= markPrice) || (order.side === "SELL" && candle.Low <= markPrice)) {
                const currentSLIdx = order.stoplossIdx;
                // Move stoploss by update stoplossIdx
                openOrder[order.id] = { ...openOrder[order.id], stoplossIdx: order.stoplossIdx + 1 };

                // Check is last target
                if (currentSLIdx + 1 === targets.length - 1) {
                    if (!order.isTrigger) {
                        // new trigger order
                        let side: "BUY" | "SELL" = order.side;
                        if (triggerStrategies[0].direction === "OPPOSITE") {
                            if (side === "BUY") side = "SELL";
                            else side = "BUY";
                        }
                        createNewOrder({ candle, entryPrice: markPrice, isTrigger: true, side, strategyId: 1 });
                    }
                    // Close order
                    closeOrder(order, markPrice, candle);
                }
            }
        }
    };

    const checkHitStoploss = (candle: BacktestCandleType) => {
        for (const id in openOrder) {
            const order = openOrder[id];

            let targets: Target[] = order.targets;
            if (order.isTrigger) {
                targets = triggerDefaultTargets;
            }

            const markPrice = getMarkPRice(targets[order.stoplossIdx].stoplossPercent, order.side, order.entryPrice);
            if ((order.side === "BUY" && candle.Low <= markPrice) || (order.side === "SELL" && candle.High >= markPrice)) {
                // close order
                closeOrder(order, markPrice, candle);
            }
        }
    };

    const createNewOrder = ({ candle, entryPrice, isTrigger, side, strategyId }: BacktestCreateNewOrderType) => {
        const orderId = randomId();
        let targets: Target[] = strategyTargets;
        const trend = getLastFiveCandle(candle.Date);
        if (isTrigger) {
            targets = triggerDefaultTargets;
        }

        openOrder[orderId] = {
            id: orderId,
            entryTime: candle.Date,
            entryPrice,
            isTrigger,
            side,
            stoplossIdx: 0,
            strategyId,
            targets,
        };

        response[candle.Date] = { ...response[candle.Date], openOrderSide: side }; // This is not a part of logic
    };

    const closeOrder = (order: BacktestOrderType, markPrice: number, candle: BacktestCandleType) => {
        if (openOrder[order.id]) {
            const tempOrder = { ...openOrder[order.id], markPrice, executedTime: candle.Date };
            delete openOrder[order.id];

            response[candle.Date] = { ...response[candle.Date], executedOrder: [tempOrder] }; // This is not a part of logic
        }
    };

    //========================= Logic start from here ========================= //
    for (let i = 481; i < dataKey.length; i++) {
        const candle = dataValues[i];
        response[candle.Date] = { candle }; // This is not a part of logic

        checkHitStoploss(candle);
        checkHitTarget(candle);

        if (checkIsNewCandle(candle.Date, timeFrame)) {
            // Check if exsist open order
            if (Object.keys(openOrder).length > 0) {
                // Check setting is order close before new candle
                if (strategy?.isCloseBeforeNewCandle) {
                    // Close all order
                    for (const orderId in openOrder) {
                        const order = openOrder[orderId];
                        const markPrice = candle.Open; // We close order at mid night => markPrice is open price
                        closeOrder(order, markPrice, candle);
                    }

                    // Create new order
                    processCreateNewCandleOrder(candle);

                    // Check hit stoploss for new oder just opned (In case hit stoploss at first candle of the day)
                    checkHitStoploss(candle);
                    checkHitTarget(candle);
                } else {
                    // If order keep over night => Do nothing, let order keep running
                }
            } else {
                // Create new order
                processCreateNewCandleOrder(candle);

                // Check hit stoploss for new oder just opned (In case hit stoploss at first candle of the day)
                checkHitStoploss(candle);
                checkHitTarget(candle);
            }
        }
    }

    response = convertTo1hChart(response);

    return response;
};

const convertTo1hChart = (chart5m: BacktestChartCandleType): BacktestChartCandleType => {
    let response: BacktestChartCandleType = {};

    // Convert the object values to an array and sort them by date ascending.
    const data5m = Object.values(chart5m).sort((a, b) => new Date(a.candle.Date).getTime() - new Date(b.candle.Date).getTime());

    // Group the 5-minute candles by 1-hour buckets.
    const groups: { [bucketKey: string]: typeof data5m } = {};
    for (const item of data5m) {
        const dateObj = new Date(item.candle.Date);
        // Set to the start of the hour
        const bucketDate = new Date(dateObj);
        bucketDate.setUTCMinutes(0, 0, 0);
        const bucketKey = bucketDate.toISOString();

        if (!groups[bucketKey]) {
            groups[bucketKey] = [];
        }
        groups[bucketKey].push(item);
    }

    // For each group, aggregate the candles if there are exactly 12 candles (5m x 12 = 60m).
    for (const bucketKey in groups) {
        const group = groups[bucketKey];
        if (group.length === 12) {
            const open = group[0].candle.Open;
            const close = group[11].candle.Close;
            const high = Math.max(...group.map((g) => g.candle.High));
            const low = Math.min(...group.map((g) => g.candle.Low));
            const volume = group.reduce((sum, g) => sum + g.candle.Volume, 0);

            const aggregatedCandle = {
                Date: bucketKey,
                Open: open,
                High: high,
                Low: low,
                Close: close,
                Volume: volume,
            };

            const executedOrder = group
                .filter((item) => item.executedOrder !== undefined)
                .map((item) => item.executedOrder)
                .flat()
                .sort((a, b) => new Date(b!.executedTime!).getTime() - new Date(a!.executedTime!).getTime());

            const openOrderSide = group.find((item) => item.openOrderSide)?.openOrderSide;

            response[bucketKey] = {
                candle: aggregatedCandle,
                executedOrder: executedOrder as Required<BacktestOrderType>[],
                openOrderSide,
            };
        }
    }

    return response;
};
