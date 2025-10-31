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

      // Create backtest configuration
      // For 2025, use Oct 9 as end date (current available data), for past years use Dec 31
      const endDate =
        year === 2025
          ? new Date('2025-10-09T23:59:59Z')
          : new Date(year, 11, 31, 23, 59, 59);

      const config: BacktestConfig = {
        symbol: `${token}USDT`,
        strategy,
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
        where: { name: token === 'BTC' ? 'Bitcoin' : token === 'ETH' ? 'Ethereum' : token === 'SOL' ? 'Solana' : token },
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
   * Get available trading strategies for a given token
   */
  async getAvailableStrategies(req: Request, res: Response) {
    try {
      const token = req.query.token as string;

      const allStrategies = {
        BTC: [
          {
            id: 'btc-momentum-pro',
            name: 'BTC Momentum Pro',
            description:
              'Moving average crossover strategy optimized for Bitcoin',
            riskLevel: 'Medium',
            expectedReturn: '15-35%',
          },
          {
            id: 'btc-breakout-trader',
            name: 'BTC Breakout Trader',
            description: 'Identifies and trades significant price breakouts',
            riskLevel: 'High',
            expectedReturn: '20-45%',
          },
          {
            id: 'btc-trend-follower',
            name: 'BTC Trend Follower',
            description: 'Long-term trend following strategy for Bitcoin',
            riskLevel: 'Low',
            expectedReturn: '10-25%',
          },
        ],
        ETH: [
          {
            id: 'eth-scalping-bot',
            name: 'ETH Scalping Bot',
            description: 'High-frequency RSI-based scalping for Ethereum',
            riskLevel: 'High',
            expectedReturn: '20-50%',
          },
          {
            id: 'eth-volatility-trader',
            name: 'ETH Volatility Trader',
            description: 'Trades based on volatility patterns in Ethereum',
            riskLevel: 'Medium',
            expectedReturn: '15-30%',
          },
          {
            id: 'eth-smart-money',
            name: 'ETH Smart Money',
            description: 'Follows institutional order flow patterns',
            riskLevel: 'Medium',
            expectedReturn: '12-28%',
          },
        ],
        SOL: [
          {
            id: 'sol-swing-trader',
            name: 'SOL Swing Trader',
            description:
              'Swing trading strategy for Solana with trend following',
            riskLevel: 'Medium',
            expectedReturn: '10-25%',
          },
          {
            id: 'sol-momentum-scalper',
            name: 'SOL Momentum Scalper',
            description: 'Fast-paced momentum scalping for Solana',
            riskLevel: 'High',
            expectedReturn: '18-40%',
          },
          {
            id: 'sol-support-resistance',
            name: 'SOL Support/Resistance',
            description: 'Trades key support and resistance levels',
            riskLevel: 'Low',
            expectedReturn: '8-20%',
          },
        ],
      };

      if (token && allStrategies[token as keyof typeof allStrategies]) {
        res.json({
          success: true,
          data: allStrategies[token as keyof typeof allStrategies],
        });
      } else {
        res.json({
          success: true,
          data: allStrategies,
        });
      }
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
