import { Request, Response } from 'express';
import { backtestingService } from '../services/backtesting.service';
import prisma from '../models/prismaClient';
import {
  ChartCandleType,
  OrderType,
} from '../types/express';
import { backtestLogic, getData1YearCandle } from './backtestLogic';

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
        year,
        strategyId,
        budget,
      }: {
        token: string;
        year: number;
        budget?: number;
        strategyId: number;
      } = req.body;

      let tokenName = token;
      if (token && token.length > 4 && token.endsWith('USDT')) {
        tokenName = token.slice(0, -4);
      }

      if (!tokenName || !strategyId || !year) {
        return res.status(400).json({
          success: false,
          message: 'Token, strategyId, and year are required',
        });
      }

      const activeTokens = await prisma.token.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
        },
      });

      const normalizedRequestName = tokenName.trim().toUpperCase();
      const matchedTokenEntry = activeTokens.find((t) => {
        const normalizedDbName = t.name.trim().toUpperCase();
        // Support both "BTC" and "BTCUSDT" format from request
        const withUsdt = `${normalizedDbName}USDT`;
        return (
          normalizedRequestName === normalizedDbName ||
          normalizedRequestName === withUsdt
        );
      });

      if (!matchedTokenEntry) {
        return res.status(400).json({
          success: false,
          message: `Invalid token. Available tokens: ${activeTokens
            .map((t) => t.name)
            .join(', ')}`,
        });
      }

      const currentYear = new Date().getFullYear();
      const validYears = [currentYear - 2, currentYear - 1, currentYear];
      if (!validYears.includes(year)) {
        return res.status(400).json({
          success: false,
          message: `Invalid year. Must be one of: ${validYears.join(', ')}`,
        });
      }

      if (isNaN(strategyId) || strategyId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid strategyId',
        });
      }

      const resolvedBudget =
        typeof budget === 'number' && !Number.isNaN(budget) ? budget : 10000;

      if (resolvedBudget < 100 || resolvedBudget > 1_000_000) {
        return res.status(400).json({
          success: false,
          message: 'Budget must be between $100 and $1,000,000',
        });
      }

      // Use the token name directly (BTC, ETH, SOL) - getData1YearCandle will normalize it
      // and look for files like BTC/BTC2024.json or fetch from Google App Script
      let yearData = {};

      try {
        const queryData = await getData1YearCandle(matchedTokenEntry.name, year);

        if (queryData.status === 200 && queryData.data) {
          yearData = queryData.data;
        } else {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid token or year',
          });
        }
      } catch (error) {
        console.error('Error fetching candle data:', error);
        return res.status(400).json({ 
          success: false,
          message: `Failed to fetch data for ${tokenName} ${year}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        });
      }

      const queryToken = await prisma.token.findUnique({
        where: { name: matchedTokenEntry.name },
      });

      if (!queryToken) {
        return res.status(400).json({
          success: false,
          message: `Token ${tokenName} not found in database`,
        });
      }

      let chartResult;
      try {
        // Use 1h timeframe for more trading opportunities per day
        chartResult = await backtestLogic({
          strategyId,
          data: yearData,
          token: queryToken,
          timeFrame: '1h',
          initialCapital: resolvedBudget,
        });
      } catch (error) {
        console.error('Error in backtestLogic:', error);
        return res.status(500).json({
          success: false,
          message: `Backtest execution failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        });
      }

      const processedResult = this.processBacktestResults(
        chartResult,
        resolvedBudget
      );

      res.json({
        message: 'Backtest done',
        result: processedResult,
        minQty: queryToken?.minQty,
        leverage: queryToken?.leverage,
      });
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
      let token = req.query.token as string;

      if (token && token.length > 4 && token.endsWith('USDT')) {
        token = token.slice(0, -4);
      }

      const activeTokens = await prisma.token.findMany({
        where: {
          isActive: true,
        },
        select: {
          name: true,
        },
      });

      const normalizedToken = token?.trim().toUpperCase();
      const matchedTokenEntry = activeTokens.find((t) => {
        const normalizedDbName = t.name.trim().toUpperCase();
        // Support both "BTC" and "BTCUSDT" format from query
        const withUsdt = `${normalizedDbName}USDT`;
        return (
          normalizedToken &&
          (normalizedToken === normalizedDbName ||
            normalizedToken === withUsdt)
        );
      });

      let whereClause: any = {
        isActive: true,
      };

      if (matchedTokenEntry) {
        const tokenStrategies = await prisma.tokenStrategy.findMany({
          where: {
            token: {
              name: matchedTokenEntry.name,
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

        const linkedStrategyIds = tokenStrategies
          .map((ts) => ts.strategyId)
          .filter((id): id is number => id !== null);

        console.log(
          `Token ${token}: Found ${linkedStrategyIds.length} directly linked strategies:`,
          linkedStrategyIds
        );

        if (linkedStrategyIds.length > 0) {
          whereClause = {
            isActive: true,
            OR: [
              {
                id: {
                  in: linkedStrategyIds,
                },
              },
              {
                parentStrategy: {
                  in: linkedStrategyIds,
                },
              },
            ],
          };
          console.log(
            `Where clause for token ${token}:`,
            JSON.stringify(whereClause, null, 2)
          );
        } else {
          whereClause = {
            isActive: true,
            id: -1,
          };
        }
      } else if (token) {
        return res.status(400).json({
          success: false,
          message: `Invalid token. Available tokens: ${activeTokens
            .map((t) => t.name)
            .join(', ')}`,
        });
      }

      const strategies = await prisma.strategy.findMany({
        where: whereClause,
        select: {
          id: true,
          description: true,
          tokenStrategies: {
            where: {
              strategyId: {
                not: null,
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

      console.log(
        `Found ${strategies.length} strategies for token ${token || 'all'}`
      );
      if (token) {
        console.log(
          `Where clause for token ${token}:`,
          JSON.stringify(whereClause, null, 2)
        );
      }

      const formattedStrategies = strategies.map((strategy) => ({
        id: String(strategy.id),
        name: strategy.description.split(' - ')[0] || strategy.description,
          description: strategy.description,
      }));

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
   * Transform chart data into trades/metrics for the frontend
   */
  private processBacktestResults(
    chartResult: ChartCandleType,
    initialCapital: number
  ) {
    const chart = chartResult;
    const allTrades: Array<{
      id: string;
      timestamp: number;
      side: OrderType['side'];
      price: number;
      quantity: number;
      pnl?: number;
    }> = [];
    const equityCurve: Array<{ timestamp: number; value: number }> = [
      {
        timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000,
        value: initialCapital,
      },
    ];

    let currentCapital = initialCapital;
    const sortedDates = Object.keys(chartResult).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    for (const date of sortedDates) {
      const candleData = chartResult[date];
      if (candleData.executedOrder && candleData.executedOrder.length > 0) {
        for (const order of candleData.executedOrder) {
          const orderSize = 1000;
          let pnl = 0;
          if (order.markPrice && order.entryPrice) {
            if (order.side === 'BUY') {
              pnl =
                ((order.markPrice - order.entryPrice) / order.entryPrice) *
                orderSize;
            } else {
              pnl =
                ((order.entryPrice - order.markPrice) / order.entryPrice) *
                orderSize;
            }
          }

          allTrades.push({
            id: String(order.id),
            timestamp: new Date(order.entryTime).getTime(),
            side: order.side,
            price: order.entryPrice,
            quantity: orderSize / order.entryPrice,
          });

          if (order.executedTime && order.markPrice) {
            currentCapital += pnl;
            allTrades.push({
              id: `${order.id}_exit`,
              timestamp: new Date(order.executedTime).getTime(),
              side: order.side === 'BUY' ? 'SELL' : 'BUY',
              price: order.markPrice,
              quantity: orderSize / order.entryPrice,
              pnl,
            });

            equityCurve.push({
              timestamp: new Date(order.executedTime).getTime(),
              value: currentCapital,
            });
          }
        }
      }
    }

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
    const totalReturnPercent = ((totalReturn / initialCapital) * 100).toFixed(
      1
    );

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
    const maxDrawdownPercent = ((maxDrawdown / initialCapital) * 100).toFixed(
      1
    );

    const returns = equityCurve.slice(1).map((point, i) => {
      const prevValue = equityCurve[i].value;
      return prevValue > 0 ? (point.value - prevValue) / prevValue : 0;
    });
    const avgReturn =
      returns.length > 0
        ? returns.reduce((sum, r) => sum + r, 0) / returns.length
        : 0;
    const variance =
      returns.length > 0
        ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
          returns.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    const holdTimes = completeTrades.map((t) => {
      return t.exit.timestamp - t.entry.timestamp;
    });
    const avgHoldTime =
      holdTimes.length > 0
        ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length
        : 0;

    return {
      chart,
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

