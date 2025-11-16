import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import axios from 'axios';
import prisma from '../models/prismaClient';
import {
  BacktestLogicType,
  candleType,
  ChartCandleType,
  CreateNewOrderType,
  IndexedCandle,
  OrderType,
} from '../types/express';
import { Target } from '@prisma/client';
import { backtestController } from '../controllers/backtest.controller';

const router = Router();

// GET  /api/backtest/tokens     # Available tokens
// GET  /api/backtest/strategies # Available strategies
// GET  /api/backtest/candles    # Get candle data
// POST /api/backtest/execute    # Run backtest

// Add routes from controller
router.get('/tokens', (req, res) =>
  backtestController.getAvailableTokens(req, res)
);

router.get('/strategies', (req, res) =>
  backtestController.getAvailableStrategies(req, res)
);

router.get('/candles', (req, res) =>
  backtestController.getCandles(req, res)
);

let tokenDataCache: {
  [token: string]: {
    [year: string]: {};
  };
} = {};

let simulateCache: {
  [token: string]: {
    [year: string]: ChartCandleType;
  };
} = {};

const randomId = () => Math.floor(100000000 + Math.random() * 900000000);

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

const getData1YearCandle = async (token: string, year: number | string) => {
  return await axios.get(
    `${process.env.GOOGLE_APP_SCRIPT}?action=readYear&token=${token}&year=${year}`
  );
};

// Execute backtest - authentication optional (for public landing page)
router.post('/execute', (req, res) =>
  backtestController.executeBacktest(req, res)
);

export default router;
