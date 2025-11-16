import { Request, Response } from 'express';
import { backtestingService } from '../services/backtesting.service';
import prisma from '../models/prismaClient';
import * as fs from 'fs';
import * as path from 'path';
import {
  BacktestLogicType,
  candleType,
  ChartCandleType,
  CreateNewOrderType,
  IndexedCandle,
  OrderType,
} from '../types/express';
import { Target } from '@prisma/client';

export class BacktestController {
  /**
   * GET /api/backtest/tokens
   * Get available tokens for backtesting
   */
  async getAvailableTokens(req: Request, res: Response) {
    try {
      const tokens = await backtestingService.getAvailableTokens();

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      console.error('Error fetching available tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available tokens',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/backtest/execute
   * Execute a backtest with given parameters using backtestLogic
   */
  async executeBacktest(req: Request, res: Response) {
    try {
      const {
        token,
        strategy,
        year,
        initialCapital = 10000,
        renderSpeed = 1,
      } = req.body;

      // Get current year for validation and date calculations
      const currentYear = new Date().getFullYear();

      // Validate required parameters
      if (!token || !strategy || !year) {
        return res.status(400).json({
          success: false,
          message: 'Token, strategy, and year are required',
        });
      }

      // Fetch all active tokens from database to validate token parameter
      const activeTokens = await prisma.token.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
        },
      });

      const validTokenNames = activeTokens.map((t) => t.name);

      // Validate token
      if (!validTokenNames.includes(token)) {
        return res.status(400).json({
          success: false,
          message: `Invalid token. Available tokens: ${validTokenNames.join(', ')}`,
        });
      }

      // Validate year - allow current year and two years prior
      const validYears = [currentYear - 2, currentYear - 1, currentYear];
      if (!validYears.includes(year)) {
        return res.status(400).json({
          success: false,
          message: `Invalid year. Must be one of: ${validYears.join(', ')}`,
        });
      }

      // Validate initial capital
      if (initialCapital < 100 || initialCapital > 1000000) {
        return res.status(400).json({
          success: false,
          message: 'Initial capital must be between $100 and $1,000,000',
        });
      }

      // Validate render speed
      if (renderSpeed < 0.5 || renderSpeed > 10) {
        return res.status(400).json({
          success: false,
          message: 'Render speed must be between 0.5x and 10x',
        });
      }

      // Validate and fetch strategy from database
      const strategyId = parseInt(String(strategy), 10);
      if (isNaN(strategyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid strategy ID',
        });
      }

      const dbStrategy = await prisma.strategy.findUnique({
        where: { id: strategyId },
        select: {
          id: true,
          description: true,
          isActive: true,
          parentStrategy: true,
          tokenStrategies: {
            select: {
              token: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!dbStrategy) {
        return res.status(400).json({
          success: false,
          message: 'Strategy not found',
        });
      }

      if (!dbStrategy.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Strategy is not active',
        });
      }

      console.log(`Strategy ${strategyId} (${dbStrategy.description}): parentStrategy = ${dbStrategy.parentStrategy}`);

      // Verify strategy is available for the selected token
      // For child strategies (with parentStrategy), check parent's token availability
      // For parent strategies, check their own tokenStrategies
      let strategyTokens: string[] = [];
      
      if (dbStrategy.parentStrategy) {
        // This is a child strategy - check parent's token availability
        // Query TokenStrategy directly to get tokens linked to the parent strategy
        console.log(`Querying TokenStrategy for parent strategy ${dbStrategy.parentStrategy}...`);
        
        const parentTokenStrategies = await prisma.tokenStrategy.findMany({
          where: {
            strategyId: dbStrategy.parentStrategy,
            token: {
              isActive: true,
            },
          },
          select: {
            token: {
              select: {
                name: true,
                isActive: true,
              },
            },
          },
        });
        
        console.log(`Found ${parentTokenStrategies.length} TokenStrategy entries for parent ${dbStrategy.parentStrategy}`);
        console.log(`Raw parentTokenStrategies:`, JSON.stringify(parentTokenStrategies, null, 2));
        
        strategyTokens = parentTokenStrategies
          .filter((ts) => ts.token !== null && ts.token.isActive)
          .map((ts) => ts.token!.name);
        
        console.log(`Child strategy ${strategyId} (parent: ${dbStrategy.parentStrategy}): Found tokens:`, strategyTokens);
        
        // Also check if parent strategy exists and is active
        const parentStrategy = await prisma.strategy.findUnique({
          where: { id: dbStrategy.parentStrategy },
          select: { id: true, isActive: true, description: true },
        });
        console.log(`Parent strategy ${dbStrategy.parentStrategy} exists:`, !!parentStrategy, `isActive:`, parentStrategy?.isActive);
      } else {
        // This is a parent strategy - check its own tokenStrategies
        strategyTokens = dbStrategy.tokenStrategies
          .filter((ts) => ts.token !== null)
          .map((ts) => ts.token!.name);
        
        console.log(`Parent strategy ${strategyId}: Found tokens:`, strategyTokens);
        console.log(`Strategy ${strategyId} tokenStrategies count:`, dbStrategy.tokenStrategies.length);
      }
      
      console.log(`Final strategyTokens for strategy ${strategyId}:`, strategyTokens);
      console.log(`Requested token: ${token}, is included: ${strategyTokens.includes(token)}`);
      
      if (!strategyTokens.includes(token)) {
        console.error(`Strategy ${strategyId} validation failed: token ${token} not in [${strategyTokens.join(', ')}]`);
        return res.status(400).json({
          success: false,
          message: `Strategy is not available for ${token}. Available tokens: ${strategyTokens.length > 0 ? strategyTokens.join(', ') : 'none'}`,
        });
      }

      // Get full token object from database
      const queryToken = await prisma.token.findUnique({
        where: {
          name: token, // Use token abbreviation directly (matches DB)
        },
      });

      if (!queryToken) {
        return res.status(400).json({
          success: false,
          message: `Token ${token} not found`,
        });
      }

      // Fetch historical data for the year from local files
      const getData1YearCandle = async (token: string, year: number | string): Promise<{ [date: string]: candleType }> => {
        const historicalDataDir = path.join(process.cwd(), 'historical_data');
        const filePath = path.join(historicalDataDir, token, `${token}${year}.json`);

        if (!fs.existsSync(filePath)) {
          throw new Error(`Historical data file not found: ${filePath}`);
        }

        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          
          // The data should already be in the format { [date: string]: candleType }
          // If it's an array, convert it to the expected format
          if (Array.isArray(data)) {
            const formattedData: { [date: string]: candleType } = {};
            data.forEach((candle: any) => {
              // Handle different possible date formats
              let dateKey = candle.Date || candle.date || candle.timestamp;
              if (typeof dateKey === 'number') {
                dateKey = new Date(dateKey).toISOString();
              }
              formattedData[dateKey] = {
                Date: dateKey,
                Open: candle.Open || candle.open,
                High: candle.High || candle.high,
                Low: candle.Low || candle.low,
                Close: candle.Close || candle.close,
                Volume: candle.Volume || candle.volume || 0,
              };
            });
            return formattedData;
          }
          
          return data;
        } catch (error) {
          console.error(`Error reading historical data file ${filePath}:`, error);
          throw new Error(`Failed to read historical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      const yearData = await getData1YearCandle(token, year);

      // Execute backtest using backtestLogic
      const chartResult = await this.backtestLogic({
        strategyId: dbStrategy.id,
        data: yearData,
        token: queryToken,
        timeFrame: '1d',
        initialCapital: initialCapital,
      });

      // Process the result to extract trades and calculate metrics
      const processedResult = this.processBacktestResults(chartResult, initialCapital);

      const response = {
        success: true,
        message: 'Backtest done',
        result: processedResult,
        minQty: queryToken.minQty,
        leverage: queryToken.leverage,
      };

      res.json(response);
    } catch (error) {
      console.error('Error executing backtest:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute backtest',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/backtest/strategies?token=BTC
   * Get available trading strategies for a given token from the database
   */
  async getAvailableStrategies(req: Request, res: Response) {
    try {
      const token = req.query.token as string;

      // Fetch all active tokens from database to validate token parameter
      const activeTokens = await prisma.token.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
        },
      });

      const validTokenNames = activeTokens.map((t) => t.name);

      // Build query to fetch strategies
      let whereClause: any = {
        isActive: true, // Only return active strategies
      };

      // If token is provided, validate it exists in database and filter by token through tokenStrategies
      if (token && validTokenNames.includes(token)) {
        // Find strategies that are either:
        // 1. Directly linked to the token via TokenStrategy
        // 2. Child strategies (parentStrategy) whose parent is linked to the token
        const tokenStrategies = await prisma.tokenStrategy.findMany({
          where: {
            token: {
              name: token,
              isActive: true,
            },
            strategyId: {
              not: null,
            },
            strategy: {
              isActive: true,
            },
          },
          select: {
            strategyId: true,
          },
        });

        const linkedStrategyIds = tokenStrategies.map((ts) => ts.strategyId).filter((id): id is number => id !== null);

        console.log(`Token ${token}: Found ${linkedStrategyIds.length} directly linked strategies:`, linkedStrategyIds);

        if (linkedStrategyIds.length > 0) {
          whereClause = {
            isActive: true,
            OR: [
              // Directly linked strategies
              {
                id: {
                  in: linkedStrategyIds,
                },
              },
              // Child strategies whose parent is linked to the token
              {
                parentStrategy: {
                  in: linkedStrategyIds,
                },
              },
            ],
          };
          console.log(`Where clause for token ${token}:`, JSON.stringify(whereClause, null, 2));
        } else {
          // No strategies linked to this token
          whereClause = {
            isActive: true,
            id: -1, // Impossible condition to return empty result
          };
        }
      } else if (token && !validTokenNames.includes(token)) {
        // Token provided but not found in database
        return res.status(400).json({
          success: false,
          message: `Invalid token. Available tokens: ${validTokenNames.join(', ')}`,
        });
      }

      // Fetch strategies from database
      const strategies = await prisma.strategy.findMany({
        where: whereClause,
        select: {
          id: true,
          description: true,
          tokenStrategies: {
            where: {
              strategyId: {
                not: null, // Only include TokenStrategy entries with a valid strategyId
              },
            },
            select: {
              token: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      });

      console.log(`Found ${strategies.length} strategies for token ${token || 'all'}`);
      if (token) {
        console.log(`Where clause for token ${token}:`, JSON.stringify(whereClause, null, 2));
      }

      // Format strategies to match frontend expectations
      const formattedStrategies = strategies.map((strategy) => {
        // Get token names for this strategy
        const tokenNames = strategy.tokenStrategies
          .filter((ts) => ts.token !== null)
          .map((ts) => ts.token!.name);

        // Create a name from description (first part) or use description
        const name = strategy.description.split(' - ')[0] || strategy.description;

        return {
          id: String(strategy.id), // Convert to string to match frontend expectations
          name: name,
          description: strategy.description,
        };
      });

      // If token is provided, return only strategies for that token
      // Otherwise return all strategies
      res.json({
        success: true,
        data: formattedStrategies,
      });
    } catch (error) {
      console.error('Error fetching strategies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available strategies',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/backtest/candles?token=BTC&year=2024
   * Return candle data for charting
   */
  async getCandles(req: Request, res: Response) {
    try {
      // Fetch all active tokens from database
      const activeTokens = await prisma.token.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      const validTokenNames = activeTokens.map((t) => t.name);
      const defaultToken = validTokenNames.length > 0 ? validTokenNames[0] : null;

      const token = String(req.query.token || defaultToken || '');
      const year = Number(req.query.year || new Date().getFullYear());

      // Validate token if provided
      if (token && !validTokenNames.includes(token)) {
        return res.status(400).json({
          success: false,
          message: `Invalid token. Available tokens: ${validTokenNames.join(', ')}`,
        });
      }

      const candles = await backtestingService.getCandlesForYear(token, year);
      res.json({ success: true, data: candles });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch candles' });
    }
  }

  /**
   * Core backtest logic function
   * This function contains all the required logic for the backtesting tool
   */
  private async backtestLogic({
    strategyId,
    data,
    token,
    timeFrame,
    initialCapital = 10000,
  }: BacktestLogicType): Promise<ChartCandleType> {
    const allCandles = this.prepareCandles(data);

    const chartData = this.aggregateToMap(allCandles, timeFrame);

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
    let availableCapital = initialCapital; // Track available capital

    const getLastFiveCandle = (pivotUTC: string) => {
      const pivotKey = this.getBucketKey(pivotUTC, timeFrame);
      const idx = sortedBucketKeysChartData.indexOf(pivotKey);
      if (idx === -1 || idx < 5) {
        // Không tìm thấy pivotKey hoặc không đủ dữ liệu trước pivot
        return 'MIXED';
      }
      // Bỏ mọi nến 5 m **>= pivot** (chỉ lấy dữ liệu trước pivot)
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
    const triggerDefaultTargets: Target[] =
      triggerDefaultStrategies[0]?.targets || [];

    const getPrevCandle = (candledate: string) => {
      const bucketKey = this.getBucketKey(candledate, timeFrame);
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

        const targets: Target[] = order.targets;

        // Check if targets exist and next target index is valid
        if (!targets || targets.length === 0 || order.stoplossIdx + 1 >= targets.length) {
          continue;
        }

        const markPrice = this.getMarkPrice(
          targets[order.stoplossIdx + 1].targetPercent,
          order.side,
          order.entryPrice
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
              if (triggerDefaultStrategies[0]?.direction === 'OPPOSITE') {
                if (side === 'BUY') side = 'SELL';
                else side = 'BUY';
              }
              createNewOrder({
                candle,
                entryPrice: markPrice,
                isTrigger: true,
                side,
                strategyId: triggerDefaultStrategies[0]?.id || strategyId,
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

        let targets: Target[] = order.targets;
        if (order.isTrigger) {
          targets = triggerDefaultTargets;
        }

        // Check if targets exist and stoplossIdx is valid
        if (!targets || targets.length === 0 || order.stoplossIdx >= targets.length) {
          console.warn(`Order ${order.id} has invalid targets or stoplossIdx. Targets: ${targets?.length || 0}, stoplossIdx: ${order.stoplossIdx}`);
          continue;
        }

        const markPrice = this.getMarkPrice(
          targets[order.stoplossIdx].stoplossPercent,
          order.side,
          order.entryPrice
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
      // Check if we have enough capital to create an order
      // Use strategy.contribution as the order size, or a default if not set
      const orderSize = strategy?.contribution || 1000;
      
      if (availableCapital < orderSize) {
        // Not enough capital to create order
        return;
      }

      const orderId = this.randomId();
      let targets: Target[] = strategyTargets;
      const trend = getLastFiveCandle(candle.Date);
      if (isTrigger) {
        targets = triggerDefaultTargets;
      }

      // Deduct capital when opening order
      availableCapital -= orderSize;

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

      response[candle.Date] = { ...response[candle.Date], openOrderSide: side }; // This is not a part of logic
    };

    const closeOrder = (
      order: OrderType,
      markPrice: number,
      candle: candleType
    ) => {
      if (openOrder[order.id]) {
        const orderSize = strategy?.contribution || 1000;
        
        // Calculate P&L based on entry and exit prices
        let pnl = 0;
        if (order.side === 'BUY') {
          // For BUY: profit when price goes up
          pnl = ((markPrice - order.entryPrice) / order.entryPrice) * orderSize;
        } else {
          // For SELL: profit when price goes down
          pnl = ((order.entryPrice - markPrice) / order.entryPrice) * orderSize;
        }
        
        // Add back the order size plus P&L to available capital
        availableCapital += orderSize + pnl;
        
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
    for (let i = 481; i < dataKey.length; i++) {
      const candle = dataValues[i];
      response[candle.Date] = { candle }; // This is not a part of logic

      checkHitStoploss(candle);
      checkHitTarget(candle);

      if (this.checkIsNewCandle(candle.Date, timeFrame)) {
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

    response = this.convertTo1hChart(response);

    return response;
  }

  // Helper functions for backtest logic
  private randomId(): number {
    return Math.floor(100000000 + Math.random() * 900000000);
  }

  private aggregateToMap(
    allCandles: IndexedCandle[],
    timeFrame: '1h' | '4h' | '1d'
  ): Record<string, candleType> {
    const map: Record<string, candleType> = {};
    for (const c of allCandles) {
      const key = this.getBucketKey(c.Date, timeFrame);
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

  private convertTo1hChart(chart5m: ChartCandleType): ChartCandleType {
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
  }

  private getBucketKey(
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

  private getMarkPrice(
    percent: number,
    side: 'BUY' | 'SELL',
    entryPrice: number
  ): number {
    if (side === 'BUY') {
      return entryPrice + (percent * entryPrice) / 100;
    } else {
      return entryPrice - (percent * entryPrice) / 100;
    }
  }

  private checkIsNewCandle(
    UTCstring: string,
    timeFrame: '1h' | '4h' | '1d'
  ): boolean {
    const date = new Date(UTCstring);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    if (timeFrame === '1h' && minutes === 0) return true;
    if (timeFrame === '4h' && hours % 4 === 0 && minutes === 0) return true;
    if (timeFrame === '1d' && hours === 0 && minutes === 0) return true;
    return false;
  }

  private prepareCandles(data: { [k: string]: candleType }): IndexedCandle[] {
    return Object.values(data)
      .map((c) => ({ ...c, ts: Date.parse(c.Date) }))
      .sort((a, b) => a.ts - b.ts);
  }

  /**
   * Process backtest results to extract trades and calculate metrics
   */
  private processBacktestResults(
    chartResult: ChartCandleType,
    initialCapital: number
  ): any {
    // Extract all executed orders (trades) from the chart result
    const allTrades: any[] = [];
    const equityCurve: Array<{ timestamp: number; value: number }> = [
      {
        timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000,
        value: initialCapital,
      },
    ];

    let currentCapital = initialCapital;

    // Sort chart data by date
    const sortedDates = Object.keys(chartResult).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    for (const date of sortedDates) {
      const candleData = chartResult[date];
      if (candleData.executedOrder && candleData.executedOrder.length > 0) {
        for (const order of candleData.executedOrder) {
          const orderSize = 1000; // Default order size, should match what's used in backtestLogic
          
          // Calculate P&L for this order
          let pnl = 0;
          if (order.markPrice && order.entryPrice) {
            if (order.side === 'BUY') {
              pnl = ((order.markPrice - order.entryPrice) / order.entryPrice) * orderSize;
            } else {
              pnl = ((order.entryPrice - order.markPrice) / order.entryPrice) * orderSize;
            }
          }

          // Add trade entry
          allTrades.push({
            id: String(order.id),
            timestamp: new Date(order.entryTime).getTime(),
            side: order.side,
            price: order.entryPrice,
            quantity: orderSize / order.entryPrice, // Approximate quantity
          });

          // Add trade exit if executed
          if (order.executedTime && order.markPrice) {
            currentCapital += pnl;
            allTrades.push({
              id: String(order.id) + '_exit',
              timestamp: new Date(order.executedTime).getTime(),
              side: order.side === 'BUY' ? 'SELL' : 'BUY',
              price: order.markPrice,
              quantity: orderSize / order.entryPrice,
              pnl: pnl,
            });

            equityCurve.push({
              timestamp: new Date(order.executedTime).getTime(),
              value: currentCapital,
            });
          }
        }
      }
    }

    // Sort trades by timestamp
    allTrades.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate metrics
    const completeTrades = [];
    for (let i = 0; i < allTrades.length - 1; i += 2) {
      if (allTrades[i + 1] && allTrades[i + 1].pnl !== undefined) {
        completeTrades.push({
          entry: allTrades[i],
          exit: allTrades[i + 1],
          pnl: allTrades[i + 1].pnl!,
        });
      }
    }

    const totalReturn = currentCapital - initialCapital;
    const totalReturnPercent = ((totalReturn / initialCapital) * 100).toFixed(1);

    const winningTrades = completeTrades.filter((t) => t.pnl > 0);
    const losingTrades = completeTrades.filter((t) => t.pnl < 0);

    const winRate =
      completeTrades.length > 0
        ? (winningTrades.length / completeTrades.length) * 100
        : 0;
    const winRatePercent = winRate.toFixed(1);

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor =
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    const avgTrade =
      completeTrades.length > 0 ? totalReturn / completeTrades.length : 0;
    const avgTradePercent = ((avgTrade / initialCapital) * 100).toFixed(2);

    const bestTrade =
      completeTrades.length > 0
        ? Math.max(...completeTrades.map((t) => t.pnl))
        : 0;
    const bestTradePercent = ((bestTrade / initialCapital) * 100).toFixed(1);

    const worstTrade =
      completeTrades.length > 0
        ? Math.min(...completeTrades.map((t) => t.pnl))
        : 0;
    const worstTradePercent = ((worstTrade / initialCapital) * 100).toFixed(1);

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = initialCapital;
    for (const point of equityCurve) {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = peak - point.value;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    const maxDrawdownPercent = ((maxDrawdown / initialCapital) * 100).toFixed(1);

    // Calculate Sharpe ratio (simplified - would need risk-free rate for accurate calculation)
    const returns = equityCurve.slice(1).map((point, i) => {
      const prevValue = equityCurve[i].value;
      return prevValue > 0 ? (point.value - prevValue) / prevValue : 0;
    });
    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const variance =
      returns.length > 0
        ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
          returns.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate average hold time (simplified)
    const holdTimes = completeTrades.map((t) => {
      return t.exit.timestamp - t.entry.timestamp;
    });
    const avgHoldTime =
      holdTimes.length > 0
        ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length
        : 0;

    return {
      totalReturn,
      totalReturnPercent,
      sharpeRatio: sharpeRatio || 0,
      maxDrawdown,
      maxDrawdownPercent,
      winRate,
      winRatePercent,
      totalTrades: completeTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      profitFactor: profitFactor || 0,
      avgTrade,
      avgTradePercent,
      bestTrade,
      bestTradePercent,
      worstTrade,
      worstTradePercent,
      avgHoldTime,
      trades: allTrades,
      equityCurve,
    };
  }
}

export const backtestController = new BacktestController();
