import brokerInstancePool from "@root/src/classes/brokerInstancePool";
import express, { NextFunction, Response } from "express";
import { roundQtyToNDecimal } from "@root/src/utils";
import { getData1YearCandle } from "@src/api/ultil";
import { CustomRequest } from "@src/middleware";
import { Target, Token } from "@prisma/client";
import prisma from "@root/prisma/database";

const router = express.Router();

let tokenDataCache: {
    [token: string]: {
        [year: string]: {};
    };
} = {};

setInterval(() => {
    tokenDataCache = {};
}, 21600000); // Clear cache after every 1h

type IndexedCandle = candleType & { ts: number };

function prepareCandles(data: { [k: string]: candleType }): IndexedCandle[] {
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
    const map: Record<string, candleType> = {};
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
        const result = queryToken ? await backtestLogic({ strategyId, data: yearData, budget, token: queryToken, timeFrame: "1d" }) : {};

        return res.status(200).json({ message: "Backtest done", result: result });
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

const getProfit = ({ qty, side, markPrice, entryPrice }: { qty: number; side: "BUY" | "SELL"; markPrice: number; entryPrice: number }) => {
    if (side === "BUY") {
        return (markPrice - entryPrice) * qty;
    } else {
        return (entryPrice - markPrice) * qty;
    }
};
const randomId = () => Math.floor(100000000 + Math.random() * 900000000);

const backtestLogic = async ({ strategyId, data, budget, token, timeFrame }: BacktestLogicType) => {
    let wallet = budget;
    const allCandles = prepareCandles(data);

    let chartData = aggregateToMap(allCandles, timeFrame);

    const sortedBucketKeysChartData = Object.keys(chartData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const chartArr = Object.values(chartData).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    const dataKey = Object.keys(data);
    const dataValues = Object.values(data);
    let openOrder: { [orderId: number]: OrderType } = {};
    let response: ChartCandleType = {};

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
    const triggerFiveSameColorStrategies = await prisma.strategy.findMany({
        where: { parentStrategy: strategyId, triggerRule: "FIVE_SAME_COLOR" },
        include: {
            targets: {
                where: { tokenId: token.id },
                orderBy: {
                    targetPercent: "asc",
                },
            },
        },
    });
    const triggerDefaultStrategies = await prisma.strategy.findMany({
        where: { parentStrategy: strategyId, triggerRule: "DEFAULT" },
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
    const triggerFiveSamecolorTargets: Target[] = triggerFiveSameColorStrategies[0]?.targets || [];
    const triggerDefaultTargets: Target[] = triggerDefaultStrategies[0].targets || [];

    const getPrevCandle = (candledate: string) => {
        const bucketKey = getBucketKey(candledate, timeFrame);
        const idx = sortedBucketKeysChartData.indexOf(bucketKey);
        if (idx === -1 || idx === 0) {
            return null;
        }
        return chartData[sortedBucketKeysChartData[idx - 1]];
    };

    const processCreateNewCandleOrder = (candle: candleType) => {
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

    const checkHitTarget = (candle: candleType) => {
        for (const orderId in openOrder) {
            const order = openOrder[orderId];

            let targets: Target[] = order.targets;
            const trend = order.trend;

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

                        if (trend === "GREEN" || trend === "RED") {
                            if (triggerFiveSameColorStrategies[0].direction === "OPPOSITE") {
                                if (side === "BUY") side = "SELL";
                                else side = "BUY";
                            }
                            createNewOrder({ candle, entryPrice: markPrice, isTrigger: true, side, strategyId: 3 });
                        } else {
                            if (triggerDefaultStrategies[0].direction === "OPPOSITE") {
                                if (side === "BUY") side = "SELL";
                                else side = "BUY";
                            }
                            createNewOrder({ candle, entryPrice: markPrice, isTrigger: true, side, strategyId: 1 });
                        }
                    }
                    // Close order
                    closeOrder(order, markPrice, candle);
                }
            }
        }
    };

    const checkHitStoploss = (candle: candleType) => {
        for (const id in openOrder) {
            const order = openOrder[id];

            let targets: Target[] = order.targets;
            if (order.isTrigger) {
                const trend = order.trend;
                targets = trend === "GREEN" || trend === "RED" ? triggerFiveSamecolorTargets : triggerDefaultTargets;
            }

            const markPrice = getMarkPRice(targets[order.stoplossIdx].stoplossPercent, order.side, order.entryPrice);
            if ((order.side === "BUY" && candle.Low <= markPrice) || (order.side === "SELL" && candle.High >= markPrice)) {
                // close order
                closeOrder(order, markPrice, candle);
            }
        }
    };

    const dummyBroker = brokerInstancePool.getBroker();

    const createNewOrder = ({ candle, entryPrice, isTrigger, side, strategyId }: CreateNewOrderType) => {
        const orderId = randomId();
        // const qty = roundQtyToNDecimal((budget / entryPrice) * token.leverage, token.minQty);
        const qty = roundQtyToNDecimal((wallet / entryPrice) * token.leverage, token.minQty);
        let targets: Target[] = strategyTargets;
        const trend = getLastFiveCandle(candle.Date);
        if (isTrigger) {
            targets = trend === "GREEN" || trend === "RED" ? triggerFiveSamecolorTargets : triggerDefaultTargets;
        }

        openOrder[orderId] = {
            id: orderId,
            entryTime: candle.Date,
            entryPrice,
            qty: qty,
            isTrigger,
            side,
            stoplossIdx: 0,
            fee: dummyBroker!.getMakerFee() * qty * entryPrice,
            strategyId,
            targets,
            trend,
        };

        response[candle.Date] = { ...response[candle.Date], openOrderSide: side }; // This is not a part of logic
    };

    const closeOrder = (order: OrderType, markPrice: number, candle: candleType) => {
        if (openOrder[order.id]) {
            const profit = getProfit({ qty: order.qty, side: order.side, markPrice, entryPrice: order.entryPrice });
            const fee = order.fee + dummyBroker!.getMakerFee() * order.qty * markPrice;

            const netProfit = profit - fee - (profit - fee) * 0.15; // 15% này là estimate commission 
            wallet += netProfit;
            const tempOrder = { ...openOrder[order.id], markPrice, executedTime: candle.Date, profit, fee };
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

const convertTo1hChart = (chart5m: ChartCandleType): ChartCandleType => {
    let response: ChartCandleType = {};

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
                executedOrder: executedOrder as Required<OrderType>[],
                openOrderSide,
            };
        }
    }

    return response;
};

type BacktestLogicType = {
    strategyId: number;
    data: { [date: string]: candleType };
    budget: number;
    token: Token;
    timeFrame: "1d" | "4h" | "1h";
};

type CreateNewOrderType = {
    candle: candleType;
    entryPrice: number;
    isTrigger: boolean;
    side: "BUY" | "SELL";
    strategyId: number;
};

export type candleType = {
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
};

type OrderType = {
    id: number;
    entryTime: string;
    executedTime?: string; // Optional
    isTrigger: boolean;
    entryPrice: number;
    markPrice?: number; // Optional
    side: "BUY" | "SELL";
    qty: number;
    profit?: number; // Optional
    stoplossIdx: number;
    fee: number;
    strategyId: number;
    targets: Target[];
    trend: "MIXED" | "GREEN" | "RED";
};

type ChartCandleType = {
    [date: string]: {
        candle: candleType;
        executedOrder?: Required<OrderType>[];
        openOrderSide?: "BUY" | "SELL";
    };
};
