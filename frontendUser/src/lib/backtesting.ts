// Backtesting API service and types

export interface BacktestConfig {
  strategy: string;
  timeframe: string;
  initialCapital: number;
  commission: number;
}

export interface BacktestResults {
  totalReturn: number;
  totalReturnPercent: string;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: string;
  winRate: number;
  winRatePercent: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  avgTrade: number;
  avgTradePercent: string;
  bestTrade: number;
  bestTradePercent: string;
  worstTrade: number;
  worstTradePercent: string;
  avgHoldTime: number;
  trades: Array<{
    id: string;
    timestamp: number;
    side: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    pnl?: number;
  }>;
  equityCurve: Array<{ timestamp: number; value: number }>;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: string;
  expectedReturn: string;
  timeframes: string[];
}

export class BacktestingAPI {
  private static readonly BASE_URL = 'http://localhost:3001/api';

  static async getStrategies(): Promise<Strategy[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/backtest/strategies`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch strategies');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }
  }

  static async getAvailableTokens(): Promise<string[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/backtest/tokens`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tokens');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  }

  static async executeBacktest(config: BacktestConfig): Promise<BacktestResults> {
    try {
      const response = await fetch(`${this.BASE_URL}/backtest/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (!response.ok || data.message !== 'Backtest done' || !data.result) {
        throw new Error(data.message || 'Backtest execution failed');
      }
      
      return data.result;
    } catch (error) {
      console.error('Error executing backtest:', error);
      throw error;
    }
  }
}

// React hook for backtesting
import { useState, useCallback } from 'react';

export interface UseBacktestingReturn {
  isRunning: boolean;
  results: BacktestResults | null;
  error: string | null;
  strategies: Strategy[];
  executeBacktest: (config: BacktestConfig) => Promise<void>;
  loadStrategies: () => Promise<void>;
  reset: () => void;
}

export function useBacktesting(): UseBacktestingReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const executeBacktest = useCallback(async (config: BacktestConfig) => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      const backtestResults = await BacktestingAPI.executeBacktest(config);
      setResults(backtestResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const loadStrategies = useCallback(async () => {
    try {
      const strategiesData = await BacktestingAPI.getStrategies();
      setStrategies(strategiesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load strategies';
      setError(errorMessage);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    results,
    error,
    strategies,
    executeBacktest,
    loadStrategies,
    reset,
  };
}

