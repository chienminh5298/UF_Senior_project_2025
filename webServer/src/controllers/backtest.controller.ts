import { Request, Response } from 'express';
import {
  backtestingService,
  BacktestConfig,
} from '../services/backtesting.service';
import prisma from '../models/prismaClient';

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
   * Execute a backtest with given parameters
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

      // Validate required parameters
      if (!token || !strategy || !year) {
        return res.status(400).json({
          success: false,
          message: 'Token, strategy, and year are required',
        });
      }

      // Validate token
      const validTokens = ['BTC', 'ETH', 'SOL'];
      if (!validTokens.includes(token)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid token. Must be one of: ' + validTokens.join(', '),
        });
      }

      // Validate year
      const validYears = [2023, 2024, 2025];
      if (!validYears.includes(year)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year. Must be one of: ' + validYears.join(', '),
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

      // Map token abbreviations to database token names
      const tokenNameMap: Record<string, string> = {
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        SOL: 'Solana',
      };
      const tokenName = tokenNameMap[token];

      // Verify strategy is available for the selected token
      const strategyTokens = dbStrategy.tokenStrategies
        .filter((ts) => ts.token !== null)
        .map((ts) => ts.token!.name);
      
      if (!strategyTokens.includes(tokenName)) {
        return res.status(400).json({
          success: false,
          message: `Strategy is not available for ${token}`,
        });
      }

      // Create backtest configuration
      // Use strategy description for the backtesting service (it uses keywords like "momentum", "scalping")
      // For 2025, use Oct 9 as end date (current available data), for past years use Dec 31
      const endDate =
        year === 2025
          ? new Date('2025-10-09T23:59:59Z')
          : new Date(year, 11, 31, 23, 59, 59);

      const config: BacktestConfig = {
        symbol: `${token}USDT`,
        strategy: dbStrategy.description, // Use description for strategy algorithm selection
        timeframe: String(year), // Using year as timeframe
        startDate: new Date(year, 0, 1),
        endDate,
        initialCapital,
        commission: 0.001,
      };

      // Execute backtest
      const results = await backtestingService.executeBacktest(config);

      // Query token from database to get minQty and leverage
      const queryToken = await prisma.token.findUnique({
        where: {
          name:
            token === 'BTC'
              ? 'Bitcoin'
              : token === 'ETH'
                ? 'Ethereum'
                : token === 'SOL'
                  ? 'Solana'
                  : token,
        },
        select: {
          minQty: true,
          leverage: true,
        },
      });

      const response = {
        success: true,
        message: 'Backtest done',
        result: results,
        minQty: queryToken?.minQty,
        leverage: queryToken?.leverage,
      };

      console.log('Backtest response:', JSON.stringify(response, null, 2));

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

      // Map token abbreviations to database token names
      const tokenNameMap: Record<string, string> = {
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        SOL: 'Solana',
      };

      // Build query to fetch strategies
      const whereClause: any = {
        isActive: true, // Only return active strategies
      };

      // If token is provided, filter by token through tokenStrategies
      if (token && tokenNameMap[token]) {
        const tokenName = tokenNameMap[token];
        whereClause.tokenStrategies = {
          some: {
            token: {
              name: tokenName,
              isActive: true,
            },
          },
        };
      }

      // Fetch strategies from database
      const strategies = await prisma.strategy.findMany({
        where: whereClause,
        select: {
          id: true,
          description: true,
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
        orderBy: {
          id: 'asc',
        },
      });

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
      const token = String(req.query.token || 'BTC');
      const year = Number(req.query.year || 2024);

      const candles = await backtestingService.getCandlesForYear(token, year);
      res.json({ success: true, data: candles });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Failed to fetch candles' });
    }
  }
}

export const backtestController = new BacktestController();
