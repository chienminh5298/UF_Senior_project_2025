import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import prisma from "../models/prismaClient";
import {
  BacktestLogicType,
  candleType,
  ChartCandleType,
  CreateNewOrderType,
  IndexedCandle,
  OrderType,
} from "../types/express";
import { Target } from "@prisma/client";

// let tokenDataCache: {
//   [token: string]: {
//     [year: string]: {};
//   };
// } = {};

// let simulateCache: {
//   [token: string]: {
//     [year: string]: ChartCandleType;
//   };
// } = {};

const randomId = () => Math.floor(100000000 + Math.random() * 900000000);
const HISTORICAL_DATA_DIR = path.join(process.cwd(), "historical_data");

function aggregateToMap(
  allCandles: IndexedCandle[],
  timeFrame: '1h' | '4h' | '1d'
) {
  const map: Record<string, candleType> = {};
  for (const c of allCandles) {
    const key = getBucketKey(c.Date, timeFrame);
    if (!map[key]) {
      map[key] = {
        Date: key,
        Open: c.Open,
        High: c.High,
        Low: c.Low,
        Close: c.Close,
        Volume: c.Volume,
      };
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

const convertTo1hChart = (chart5m: ChartCandleType): ChartCandleType => {
  let response: ChartCandleType = {};

  // Convert the object values to an array and sort them by date ascending.
  const data5m = Object.values(chart5m).sort(
    (a, b) =>
      new Date(a.candle.Date).getTime() - new Date(b.candle.Date).getTime()
  );

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
        .sort(
          (a, b) =>
            new Date(b!.executedTime!).getTime() -
            new Date(a!.executedTime!).getTime()
        );

      const openOrderSide = group.find(
        (item) => item.openOrderSide
      )?.openOrderSide;

      response[bucketKey] = {
        candle: aggregatedCandle,
        executedOrder: executedOrder as Required<OrderType>[],
        openOrderSide,
      };
    }
  }

  return response;
};

function getBucketKey(
  candleDate: string,
  timeFrame: '1h' | '4h' | '1d'
): string {
  const d = new Date(candleDate);
  if (timeFrame === '1d') {
    d.setUTCHours(0, 0, 0, 0);
  } else {
    d.setUTCMinutes(0, 0, 0);
    if (timeFrame === '4h') {
      const h = d.getUTCHours();
      d.setUTCHours(Math.floor(h / 4) * 4);
    }
  }
  return d.toISOString();
}

const getMarkPrice = (
  percent: number,
  side: 'BUY' | 'SELL',
  entryPrice: number
) => {
  if (side === 'BUY') {
    return entryPrice + (percent * entryPrice) / 100;
  } else {
    return entryPrice - (percent * entryPrice) / 100;
  }
};

const checkIsNewCandle = (UTCstring: string, timeFrame: '1h' | '4h' | '1d') => {
  const date = new Date(UTCstring);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  if (timeFrame === '1h' && minutes === 0) return true;
  if (timeFrame === '4h' && hours % 4 === 0 && minutes === 0) return true;
  if (timeFrame === '1d' && hours === 0 && minutes === 0) return true;
  return false;
};

function prepareCandles(data: { [k: string]: candleType }): IndexedCandle[] {
  return Object.values(data)
    .map((c) => ({ ...c, ts: Date.parse(c.Date) }))
    .sort((a, b) => a.ts - b.ts);
}

const loadLocalYearData = async (token: string, year: number | string) => {
  const normalizedToken = token.toUpperCase();
  const normalizedYear = year.toString();
  const candidateFiles = [
    path.join(
      HISTORICAL_DATA_DIR,
      normalizedToken,
      `${normalizedToken}${normalizedYear}.json`
    ),
    path.join(
      HISTORICAL_DATA_DIR,
      normalizedToken,
      `${normalizedYear}.json`
    ),
  ];

  for (const filePath of candidateFiles) {
    try {
      await fs.access(filePath);
      const fileContents = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(fileContents);
      console.log(
        `📁 Loaded local backtest data: ${path.relative(
          HISTORICAL_DATA_DIR,
          filePath
        )}`
      );
      return { status: 200, data: parsed };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(
          `❌ Failed reading ${path.relative(
            HISTORICAL_DATA_DIR,
            filePath
          )}:`,
          error
        );
        throw error;
      }
    }
  }

  throw new Error(
    `Local data file not found for ${normalizedToken} ${normalizedYear}`
  );
};

export const getData1YearCandle = async (
  token: string,
  year: number | string
) => {
  const normalizedToken = token.toUpperCase();
  const scriptUrl = process.env.GOOGLE_APP_SCRIPT;

  if (scriptUrl && /^https?:\/\//i.test(scriptUrl)) {
    try {
      return await axios.get(
        `${scriptUrl}?action=readYear&token=${normalizedToken}&year=${year}`
      );
    } catch (error) {
      console.warn(
        `⚠️  Remote Google Script fetch failed for ${normalizedToken} ${year}: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Falling back to local files.`
      );
    }
  } else {
    console.warn(
      "⚠️  GOOGLE_APP_SCRIPT env is not configured. Falling back to local historical data files."
    );
  }

  return await loadLocalYearData(normalizedToken, year);
};

export const backtestLogic = async ({
  strategyId,
  data,
  token,
  timeFrame,
}: BacktestLogicType) => {
  const allCandles = prepareCandles(data);

  const chartData = aggregateToMap(allCandles, timeFrame);

  const sortedBucketKeysChartData = Object.keys(chartData).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const chartArr = Object.values(chartData).sort(
    (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
  );

  const dataKey = Object.keys(data);
  const dataValues = Object.values(data);
  let openOrder: { [orderId: number]: OrderType } = {};
  let response: ChartCandleType = {};

  const getLastFiveCandle = (pivotUTC: string) => {
    const pivotKey = getBucketKey(pivotUTC, timeFrame);
    const idx = sortedBucketKeysChartData.indexOf(pivotKey);
    if (idx === -1 || idx < 5) {
      // Không tìm thấy pivotKey hoặc không đủ dữ liệu trước pivot
      return 'MIXED';
    }
    // Bỏ mọi nến 5 m **>= pivot** (chỉ lấy dữ liệu trước pivot)
    const series = chartArr.slice(idx - 5, idx);
    const allGreen = series.every((c) => c.Close > c.Open);
    if (allGreen) return 'GREEN';

    const allRed = series.every((c) => c.Close < c.Open);
    if (allRed) return 'RED';

    return 'MIXED';
  };

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      targets: {
        where: { tokenId: token.id },
        orderBy: {
          targetPercent: 'asc',
        },
      },
    },
  });

  const triggerDefaultStrategies = await prisma.strategy.findMany({
    where: { parentStrategy: strategyId },
    include: {
      targets: {
        where: { tokenId: token.id },
        orderBy: {
          targetPercent: 'asc',
        },
      },
    },
  });

  const strategyTargets: Target[] = strategy?.targets || [];
  const primaryTriggerStrategy = triggerDefaultStrategies[0];
  const triggerDefaultTargets: Target[] =
    primaryTriggerStrategy?.targets || [];

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
      let side: 'BUY' | 'SELL' = 'BUY';
      if (prevCandle.Close > prevCandle.Open) {
        if (strategy.direction === 'SAME') side = 'BUY';
        else side = 'SELL';
      } else {
        if (strategy.direction === 'SAME') side = 'SELL';
        else side = 'BUY';
      }

      createNewOrder({
        candle,
        entryPrice: candle.Open,
        isTrigger: false,
        side,
        strategyId: strategy.id,
      });
    }
  };

  const checkHitTarget = (candle: candleType) => {
    for (const orderId in openOrder) {
      const order = openOrder[orderId];
      if (!order) {
        continue;
      }

      const targets: Target[] = order.targets;

      if (
        !targets ||
        targets.length === 0 ||
        order.stoplossIdx + 1 >= targets.length
      ) {
        continue;
      }

      const nextTarget = targets[order.stoplossIdx + 1];
      if (!nextTarget) {
        console.warn(
          `checkHitTarget: missing target at index ${
            order.stoplossIdx + 1
          } for order ${order.id}`,
        );
        continue;
      }

      const markPrice = getMarkPrice(
        nextTarget.targetPercent,
        order.side,
        order.entryPrice,
      );

      if (
        (order.side === 'BUY' && candle.High >= markPrice) ||
        (order.side === 'SELL' && candle.Low <= markPrice)
      ) {
        const currentSLIdx = order.stoplossIdx;
        // Move stoploss by update stoplossIdx
        openOrder[order.id] = {
          ...openOrder[order.id],
          stoplossIdx: order.stoplossIdx + 1,
        };

        // Check is last target
        if (currentSLIdx + 1 === targets.length - 1) {
          if (!order.isTrigger) {
            // new trigger order
            let side: 'BUY' | 'SELL' = order.side;
            if (primaryTriggerStrategy?.direction === 'OPPOSITE') {
              if (side === 'BUY') side = 'SELL';
              else side = 'BUY';
            }
            createNewOrder({
              candle,
              entryPrice: markPrice,
              isTrigger: true,
              side,
              strategyId: primaryTriggerStrategy?.id || strategyId,
            });
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
      if (!order) {
        continue;
      }

      let targets: Target[] = order.targets;
      if (order.isTrigger) {
        targets = triggerDefaultTargets;
      }

      if (
        !targets ||
        targets.length === 0 ||
        order.stoplossIdx >= targets.length
      ) {
        continue;
      }

      const slTarget = targets[order.stoplossIdx];
      if (!slTarget) {
        console.warn(
          `checkHitStoploss: missing stoploss target at index ${order.stoplossIdx} for order ${order.id}`,
        );
        continue;
      }

      const markPrice = getMarkPrice(
        slTarget.stoplossPercent,
        order.side,
        order.entryPrice,
      );
      if (
        (order.side === 'BUY' && candle.Low <= markPrice) ||
        (order.side === 'SELL' && candle.High >= markPrice)
      ) {
        // close order
        closeOrder(order, markPrice, candle);
      }
    }
  };

  const createNewOrder = ({
    candle,
    entryPrice,
    isTrigger,
    side,
    strategyId,
  }: CreateNewOrderType) => {
    const orderId = randomId();
    let targets: Target[] = strategyTargets;
    const trend = getLastFiveCandle(candle.Date);
    if (isTrigger) {
      targets = triggerDefaultTargets;
    }

    if (!targets || targets.length === 0) {
      console.warn(`⚠️  Cannot create order: no targets for strategy ${strategyId}`);
      return;
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
      trend,
    };

    console.log(`📝 Order #${orderId}: ${side} @ ${entryPrice.toFixed(2)} (${isTrigger ? 'TRIGGER' : 'MAIN'})`);

    response[candle.Date] = { ...response[candle.Date], openOrderSide: side }; // This is not a part of logic
  };

  const closeOrder = (
    order: OrderType,
    markPrice: number,
    candle: candleType
  ) => {
    if (openOrder[order.id]) {
      const pnl = order.side === 'BUY' 
        ? ((markPrice - order.entryPrice) / order.entryPrice) * 100
        : ((order.entryPrice - markPrice) / order.entryPrice) * 100;
      
      console.log(`💰 Order #${order.id} closed: ${order.side} entry ${order.entryPrice.toFixed(2)} → exit ${markPrice.toFixed(2)}, P&L: ${pnl.toFixed(2)}%`);

      const tempOrder = {
        ...openOrder[order.id],
        markPrice,
        executedTime: candle.Date,
      };
      delete openOrder[order.id];

      response[candle.Date] = {
        ...response[candle.Date],
        executedOrder: [tempOrder],
      }; // This is not a part of logic
    }
  };

  //========================= Logic start from here ========================= //
  console.log(`🔄 Starting backtest: ${dataValues.length} candles, starting at index 481`);
  console.log(`📊 Strategy ${strategyId} for token ${token.name}, timeFrame: ${timeFrame}`);
  console.log(`🎯 Main strategy targets: ${strategyTargets.length}, Trigger targets: ${triggerDefaultTargets.length}`);
  
  let totalTradesOpened = 0;
  let totalTradesClosed = 0;

  for (let i = 481; i < dataValues.length; i++) {
    const candle = dataValues[i];
    response[candle.Date] = { candle }; // This is not a part of logic

    // First check if any existing orders hit their stoploss or targets
    const openOrdersBefore = Object.keys(openOrder).length;
    checkHitStoploss(candle);
    checkHitTarget(candle);
    const openOrdersAfter = Object.keys(openOrder).length;

    // If an order was closed (count decreased) and no orders remain, immediately open a new one
    const orderWasClosed = openOrdersBefore > openOrdersAfter;
    const noOpenOrders = openOrdersAfter === 0;
    
    if (orderWasClosed) {
      totalTradesClosed += (openOrdersBefore - openOrdersAfter);
    }

    if (checkIsNewCandle(candle.Date, timeFrame)) {
      // At the start of a new time period
      if (Object.keys(openOrder).length > 0) {
        if (strategy?.isCloseBeforeNewCandle) {
          // Close all orders at the start of new candle
          for (const orderId in openOrder) {
            const order = openOrder[orderId];
            const markPrice = candle.Open;
            closeOrder(order, markPrice, candle);
            totalTradesClosed++;
          }
          // Immediately create new order
          processCreateNewCandleOrder(candle);
          totalTradesOpened++;
          checkHitStoploss(candle);
          checkHitTarget(candle);
        }
        // If isCloseBeforeNewCandle is false, let orders run
      } else {
        // No open orders at start of new candle - create one
        processCreateNewCandleOrder(candle);
        totalTradesOpened++;
        checkHitStoploss(candle);
        checkHitTarget(candle);
      }
    } else if (orderWasClosed && noOpenOrders) {
      // Mid-candle: if an order just closed and we have no open orders, create a new one immediately
      processCreateNewCandleOrder(candle);
      totalTradesOpened++;
      checkHitStoploss(candle);
      checkHitTarget(candle);
    }
  }

  console.log(`✅ Backtest complete: ${totalTradesOpened} trades opened, ${totalTradesClosed} trades closed`);
  console.log(`📈 Final response has ${Object.keys(response).length} time points`);
  

  response = convertTo1hChart(response);

  return response;
};