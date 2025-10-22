import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Types for market data and backtesting
export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestConfig {
  symbol: string;
  strategy: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  commission: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl?: number;
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
  trades: Trade[];
  equityCurve: { timestamp: number; value: number }[];
}

export class BacktestingService {
  private static readonly GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgM2khVjBMvedIXx4S2GuUKvl7LoWUUhkSP0OsaCaf-HiU2dAxBRhCXk_eyHW5tXd1_Q/exec';
  private static readonly HISTORICAL_DATA_DIR = path.join(process.cwd(), 'historical_data');

  /**
   * Load historical data from local JSON file
   */
  private async loadLocalData(token: string, year: number): Promise<CandleData[]> {
    // Try multiple file naming conventions
    const filePatterns = [
      path.join(BacktestingService.HISTORICAL_DATA_DIR, token, `${token}${year}.json`)
    ];
    
    let filePath = '';
    let fileExists = false;

    // Find which file pattern exists
    for (const pattern of filePatterns) {
      if (fs.existsSync(pattern)) {
        filePath = pattern;
        fileExists = true;
        break;
      }
    }

    if (!fileExists) {
      console.log(`📁 Local file not found. Tried: ${token}/${year}.json and ${token}/${token}${year}.json`);
      return [];
    }

    try {
      console.log(`📁 Loading local data from: ${path.basename(filePath)}`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      let dataArray: any[] = [];

      // Handle both array and object formats
      if (Array.isArray(data)) {
        dataArray = data;
      } else if (typeof data === 'object' && data !== null) {
        // Convert object format to array
        // Object format: { "timestamp": { "Date": "...", "Open": ..., ... } }
        dataArray = Object.values(data);
        console.log(`📋 Converted object format to array (${dataArray.length} entries)`);
      } else {
        console.error(`❌ Invalid local data format for ${path.basename(filePath)} - expected array or object`);
        return [];
      }

      // Transform to CandleData format
      const candles: CandleData[] = dataArray.map((item: any) => ({
        timestamp: new Date(item.timestamp || item.time || item.date || item.Date).getTime(),
        open: parseFloat(item.open || item.Open),
        high: parseFloat(item.high || item.High),
        low: parseFloat(item.low || item.Low),
        close: parseFloat(item.close || item.Close),
        volume: parseFloat(item.volume || item.Volume || 0)
      }));

      console.log(`✅ Loaded ${candles.length} candles from local file: ${path.basename(filePath)}`);
      return candles;
    } catch (error) {
      console.error(`❌ Error loading local file ${path.basename(filePath)}:`, error);
      return [];
    }
  }

  /**
   * Fetch historical data from Google Apps Script
   */
  private async fetchFromGoogleScript(
    token: string,
    year: number
  ): Promise<CandleData[]> {
    try {
      const url = `${BacktestingService.GOOGLE_SCRIPT_URL}?action=readYear&token=${token}&year=${year}`;
      console.log(`📡 Fetching data from Google Script: ${token} ${year}`);
      
      const response = await axios.get(url, {
        timeout: 30000 // 30 second timeout
      });

      if (!response.data || !Array.isArray(response.data)) {
        console.error(`❌ Invalid response from Google Script for ${token} ${year}:`, response.data);
        throw new Error(`Invalid response from Google Script: expected array, got ${typeof response.data}`);
      }

      if (response.data.length === 0) {
        console.warn(`⚠️  Google Script returned empty array for ${token} ${year}`);
        return [];
      }

      // Transform Google Script data to CandleData format
      const candles: CandleData[] = response.data.map((item: any) => ({
        timestamp: new Date(item.timestamp || item.time || item.date).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0)
      }));

      console.log(`✅ Fetched ${candles.length} candles from Google Script for ${token} ${year}`);
      return candles;
    } catch (error) {
      console.error(`❌ Failed to fetch data from Google Script for ${token} ${year}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('   Response status:', error.response?.status);
        console.error('   Response data:', error.response?.data);
      }
      throw error;
    }
  }

  /**
   * Fetch historical market data from Google Apps Script or fallback to Binance Live API
   */
  async fetchHistoricalData(
    symbol: string, 
    interval: string, 
    startTime: number, 
    endTime: number
  ): Promise<CandleData[]> {
    const token = symbol.replace('USDT', '');
    const supportedTokens = ['SOL', 'BTC', 'ETH'];
    
    console.log(`🔍 Fetching data for ${symbol} (${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()})`);
    
    try {
      // Check if token is supported by Google Script (SOL, BTC, ETH)
      if (supportedTokens.includes(token)) {
        // Get years from timeframe
        const startYear = new Date(startTime).getFullYear();
        const endYear = new Date(endTime).getFullYear();
        const years = [];
        
        // Collect years from 2023-2025 that overlap with requested range
        for (let year = Math.max(2023, startYear); year <= Math.min(2025, endYear); year++) {
          years.push(year);
        }

        console.log(`📅 Loading local data for years: ${years.join(', ')}`);

        // Fetch data for each year (ONLY from local files)
        const allCandles: CandleData[] = [];
        let fetchErrors = 0;
        
        for (const year of years) {
          try {
            // Load from local file only
            const yearData = await this.loadLocalData(token, year);
            
            if (yearData.length === 0) {
              console.warn(`⚠️  No local data found for ${token} ${year}`);
              fetchErrors++;
            } else {
              allCandles.push(...yearData);
            }
          } catch (error) {
            fetchErrors++;
            console.warn(`⚠️  Failed to load ${token} data for year ${year}:`, error);
          }
        }

        if (allCandles.length > 0) {
          // Filter by time range and sort
          const filtered = allCandles
            .filter(c => c.timestamp >= startTime && c.timestamp <= endTime)
            .sort((a, b) => a.timestamp - b.timestamp);
          
          console.log(`✅ Successfully fetched ${filtered.length} candles from local files for ${symbol}`);
          console.log(`   Total candles before filtering: ${allCandles.length}`);
          if (filtered.length > 0) {
            console.log(`   Date range: ${new Date(filtered[0]?.timestamp).toISOString()} to ${new Date(filtered[filtered.length-1]?.timestamp).toISOString()}`);
          }
          return filtered;
        } else {
          console.error(`❌ No data retrieved from local files for ${token}`);
          console.error(`   Attempted years: ${years.join(', ')}`);
          console.error(`   Errors encountered: ${fetchErrors}/${years.length}`);
          console.error(`   Make sure files exist: historical_data/${token}/${token}2024.json or historical_data/${token}/2024.json`);
          throw new Error(`No local data files found for ${token}. Please ensure data files exist in historical_data/${token}/`);
        }
      } else {
        console.log(`⚠️  Token ${token} not supported. Supported: ${supportedTokens.join(', ')}`);
        throw new Error(`Token ${token} not supported. Use BTC, ETH, or SOL.`);
      }
    } catch (error) {
      console.error(`❌ Error fetching historical data:`, error);
      throw new Error(`Failed to load historical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Fallback to live Binance API for recent data
   */
  private async fetchLiveData(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
    limit: number = 1500
  ): Promise<CandleData[]> {
    try {
      console.log(`Falling back to live API for ${symbol}, interval: ${interval}, from: ${new Date(startTime).toISOString()} to: ${new Date(endTime).toISOString()}`);
      
      const allCandles: CandleData[] = [];
      const maxLimit = 1500; // Binance API max limit
      let currentStartTime = startTime;
      
      // Fetch data in batches if needed
      while (currentStartTime < endTime) {
        const response = await axios.get('https://fapi.binance.com/fapi/v1/klines', {
          params: {
            symbol: symbol.toUpperCase(),
            interval,
            startTime: currentStartTime,
            endTime,
            limit: maxLimit
          },
          timeout: 10000
        });

        if (!response.data || response.data.length === 0) {
          console.log('No more data available from API');
          break;
        }

        const candles = response.data.map((candle: any[]) => ({
          timestamp: candle[0],
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5])
        }));

        allCandles.push(...candles);
        
        // If we got less than the limit, we've reached the end
        if (candles.length < maxLimit) {
          break;
        }
        
        // Update start time for next batch
        currentStartTime = candles[candles.length - 1].timestamp + 1;
      }

      console.log(`Fetched ${allCandles.length} candles from live API`);
      return allCandles;
    } catch (error) {
      console.error('Error fetching live data:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data || error.message);
      }
      throw new Error('Failed to fetch historical market data from Binance API');
    }
  }

  /**
   * Convert timeframe string to Binance interval format
   */
  private convertTimeframeToInterval(timeframe: string): string {
    const mapping: { [key: string]: string } = {
      '1W': '1d', // Use daily data for 1 week
      '1M': '1h', // Use hourly data for 1 month  
      '3M': '4h', // Use 4-hour data for 3 months
      '6M': '1d', // Use daily data for 6 months
      '1Y': '1d'  // Use daily data for 1 year
    };
    return mapping[timeframe] || '1d';
  }

  /**
   * Calculate date range based on timeframe
   * Uses historical data from 2023-2025 range (Google Apps Script data)
   */
  private calculateDateRange(timeframe: string): { startTime: number; endTime: number } {
    // TODO: Change to Date.now() when using live data
    // Currently using October 9, 2025 as the latest available date in local historical data
    const endTime = new Date('2025-10-09T23:59:59Z').getTime();
    let startTime: number;

    switch (timeframe) {
      case '1W':
        startTime = endTime - (7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        startTime = endTime - (30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        startTime = endTime - (90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        startTime = endTime - (180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startTime = endTime - (365 * 24 * 60 * 60 * 1000);
        break;
      case '2Y':
        startTime = endTime - (730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = endTime - (30 * 24 * 60 * 60 * 1000);
    }

    return { startTime, endTime };
  }

  /**
   * Simple Moving Average Crossover Strategy
   */
  private executeMomentumStrategy(data: CandleData[], config: BacktestConfig): Trade[] {
    const trades: Trade[] = [];
    const shortPeriod = 10;
    const longPeriod = 20;
    let position: 'LONG' | 'SHORT' | null = null;
    let entryPrice = 0;
    let tradeId = 1;

    for (let i = longPeriod; i < data.length; i++) {
      // Calculate moving averages
      const shortMA = this.calculateSMA(data.slice(i - shortPeriod, i), shortPeriod);
      const longMA = this.calculateSMA(data.slice(i - longPeriod, i), longPeriod);
      const prevShortMA = this.calculateSMA(data.slice(i - shortPeriod - 1, i - 1), shortPeriod);
      const prevLongMA = this.calculateSMA(data.slice(i - longPeriod - 1, i - 1), longPeriod);

      const currentPrice = data[i].close;

      // Entry signals
      if (!position && shortMA > longMA && prevShortMA <= prevLongMA) {
        // Bullish crossover - go long
        position = 'LONG';
        entryPrice = currentPrice;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'BUY',
          price: currentPrice,
          quantity: config.initialCapital / currentPrice
        });
      } else if (!position && shortMA < longMA && prevShortMA >= prevLongMA) {
        // Bearish crossover - go short
        position = 'SHORT';
        entryPrice = currentPrice;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'SELL',
          price: currentPrice,
          quantity: config.initialCapital / currentPrice
        });
      }

      // Exit signals
      if (position === 'LONG' && (shortMA < longMA || i === data.length - 1)) {
        const pnl = ((currentPrice - entryPrice) / entryPrice) * config.initialCapital;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'SELL',
          price: currentPrice,
          quantity: config.initialCapital / entryPrice,
          pnl
        });
        position = null;
      } else if (position === 'SHORT' && (shortMA > longMA || i === data.length - 1)) {
        const pnl = ((entryPrice - currentPrice) / entryPrice) * config.initialCapital;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'BUY',
          price: currentPrice,
          quantity: config.initialCapital / entryPrice,
          pnl
        });
        position = null;
      }
    }

    return trades;
  }

  /**
   * RSI Mean Reversion Strategy
   */
  private executeScalpingStrategy(data: CandleData[], config: BacktestConfig): Trade[] {
    const trades: Trade[] = [];
    const rsiPeriod = 14;
    let position: 'LONG' | 'SHORT' | null = null;
    let entryPrice = 0;
    let tradeId = 1;

    for (let i = rsiPeriod; i < data.length; i++) {
      const rsi = this.calculateRSI(data.slice(i - rsiPeriod, i + 1), rsiPeriod);
      const currentPrice = data[i].close;

      // Entry signals
      if (!position && rsi < 30) {
        // Oversold - go long
        position = 'LONG';
        entryPrice = currentPrice;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'BUY',
          price: currentPrice,
          quantity: config.initialCapital / currentPrice
        });
      } else if (!position && rsi > 70) {
        // Overbought - go short
        position = 'SHORT';
        entryPrice = currentPrice;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'SELL',
          price: currentPrice,
          quantity: config.initialCapital / currentPrice
        });
      }

      // Exit signals
      if (position === 'LONG' && (rsi > 50 || i === data.length - 1)) {
        const pnl = ((currentPrice - entryPrice) / entryPrice) * config.initialCapital;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'SELL',
          price: currentPrice,
          quantity: config.initialCapital / entryPrice,
          pnl
        });
        position = null;
      } else if (position === 'SHORT' && (rsi < 50 || i === data.length - 1)) {
        const pnl = ((entryPrice - currentPrice) / entryPrice) * config.initialCapital;
        trades.push({
          id: `trade_${tradeId++}`,
          timestamp: data[i].timestamp,
          side: 'BUY',
          price: currentPrice,
          quantity: config.initialCapital / entryPrice,
          pnl
        });
        position = null;
      }
    }

    return trades;
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(data: CandleData[], period: number): number {
    const sum = data.slice(-period).reduce((acc, candle) => acc + candle.close, 0);
    return sum / period;
  }

  /**
   * Calculate RSI
   */
  private calculateRSI(data: CandleData[], period: number): number {
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i - 1].close);
    }

    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate backtest performance metrics
   */
  private calculateMetrics(trades: Trade[], initialCapital: number): BacktestResults {
    const completeTrades = [];
    let currentCapital = initialCapital;
    const equityCurve = [{ timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000, value: initialCapital }];

    // Group trades into complete round trips
    for (let i = 0; i < trades.length - 1; i += 2) {
      if (trades[i + 1] && trades[i + 1].pnl !== undefined) {
        completeTrades.push({
          entry: trades[i],
          exit: trades[i + 1],
          pnl: trades[i + 1].pnl!
        });
        currentCapital += trades[i + 1].pnl!;
        equityCurve.push({
          timestamp: trades[i + 1].timestamp,
          value: currentCapital
        });
      }
    }

    const totalReturn = currentCapital - initialCapital;
    const totalReturnPercent = ((totalReturn / initialCapital) * 100).toFixed(1);
    
    const winningTrades = completeTrades.filter(t => t.pnl > 0);
    const losingTrades = completeTrades.filter(t => t.pnl < 0);
    
    const winRate = completeTrades.length > 0 ? (winningTrades.length / completeTrades.length) * 100 : 0;
    
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    const avgTrade = completeTrades.length > 0 ? totalReturn / completeTrades.length : 0;
    const avgTradePercent = ((avgTrade / initialCapital) * 100).toFixed(2);
    
    const bestTrade = completeTrades.length > 0 ? Math.max(...completeTrades.map(t => t.pnl)) : 0;
    const bestTradePercent = ((bestTrade / initialCapital) * 100).toFixed(1);
    
    const worstTrade = completeTrades.length > 0 ? Math.min(...completeTrades.map(t => t.pnl)) : 0;
    const worstTradePercent = ((worstTrade / initialCapital) * 100).toFixed(1);

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = initialCapital;
    for (const point of equityCurve) {
      if (point.value > peak) peak = point.value;
      const drawdown = (peak - point.value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    const maxDrawdownPercent = (maxDrawdown * 100).toFixed(1);

    // Calculate Sharpe ratio (simplified)
    const returns = equityCurve.slice(1).map((point, i) => 
      (point.value - equityCurve[i].value) / equityCurve[i].value
    );
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Calculate average hold time (in hours)
    const holdTimes = completeTrades.map(t => (t.exit.timestamp - t.entry.timestamp) / (1000 * 60 * 60));
    const avgHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;

    return {
      totalReturn,
      totalReturnPercent: totalReturnPercent.startsWith('-') ? totalReturnPercent : `+${totalReturnPercent}%`,
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      maxDrawdown,
      maxDrawdownPercent: `-${maxDrawdownPercent}%`,
      winRate,
      winRatePercent: `${winRate.toFixed(1)}%`,
      totalTrades: completeTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      profitFactor: Number(profitFactor.toFixed(2)),
      avgTrade,
      avgTradePercent: avgTradePercent.startsWith('-') ? avgTradePercent : `+${avgTradePercent}%`,
      bestTrade,
      bestTradePercent: `+${bestTradePercent}%`,
      worstTrade,
      worstTradePercent: `${worstTradePercent}%`,
      avgHoldTime: Number(avgHoldTime.toFixed(1)),
      trades,
      equityCurve
    };
  }

  /**
   * Execute backtest with given configuration
   */
  async executeBacktest(config: BacktestConfig): Promise<BacktestResults> {
    try {
      // Get symbol for API call
      const symbol = this.getSymbolForStrategy(config.strategy);
      
      // Use the startDate and endDate from config instead of calculateDateRange
      const startTime = config.startDate.getTime();
      const endTime = config.endDate.getTime();
      
      // Convert timeframe to interval
      const interval = this.convertTimeframeToInterval(config.timeframe);
      
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(symbol, interval, startTime, endTime);
      
      if (historicalData.length === 0) {
        throw new Error('No historical data available for the selected timeframe');
      }

      console.log(`Executing backtest with ${historicalData.length} candles from ${new Date(historicalData[0].timestamp).toISOString()} to ${new Date(historicalData[historicalData.length - 1].timestamp).toISOString()}`);

      // Execute strategy based on type
      let trades: Trade[] = [];
      
      if (config.strategy.toLowerCase().includes('momentum')) {
        trades = this.executeMomentumStrategy(historicalData, config);
      } else if (config.strategy.toLowerCase().includes('scalping')) {
        trades = this.executeScalpingStrategy(historicalData, config);
      } else {
        // Default to momentum strategy
        trades = this.executeMomentumStrategy(historicalData, config);
      }

      console.log(`Generated ${trades.length} trades from ${new Date(trades[0]?.timestamp || 0).toISOString()} to ${new Date(trades[trades.length - 1]?.timestamp || 0).toISOString()}`);

      // Calculate and return results
      return this.calculateMetrics(trades, config.initialCapital);
      
    } catch (error) {
      console.error('Backtest execution error:', error);
      throw new Error(`Backtest failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Public API to fetch candles for a given symbol and timeframe
   */
  async getCandlesForTimeframe(symbol: string, timeframe: string): Promise<CandleData[]> {
    const tf = timeframe.toUpperCase();
    const { startTime, endTime } = this.calculateDateRange(tf);
    const interval = this.convertTimeframeToInterval(tf);
    const data = await this.fetchHistoricalData(symbol.toUpperCase(), interval, startTime, endTime);
    return data;
  }

  /**
   * Public API to fetch candles for a given token and year
   */
  async getCandlesForYear(token: string, year: number): Promise<CandleData[]> {
    const startTime = new Date(year, 0, 1).getTime();
    const endTime = new Date(year, 11, 31, 23, 59, 59).getTime();
    const symbol = `${token}USDT`;
    
    // Fetch data directly for the specific year
    const data = await this.loadLocalData(token, year);
    
    if (data.length === 0) {
      throw new Error(`No data available for ${token} in ${year}`);
    }
    
    return data;
  }

  /**
   * Get trading symbol based on strategy name (USDT-M Perpetual Futures)
   */
  private getSymbolForStrategy(strategy: string): string {
    if (strategy.toLowerCase().includes('btc')) return 'BTCUSDT';
    if (strategy.toLowerCase().includes('eth')) return 'ETHUSDT';
    if (strategy.toLowerCase().includes('sol')) return 'SOLUSDT';
    return 'BTCUSDT'; // Default
  }

  /**
   * Get available tokens for backtesting (USDT-M Perpetual Futures)
   */
  async getAvailableTokens(): Promise<string[]> {
    return [
      'BTCUSDT',  // Bitcoin
      'ETHUSDT',  // Ethereum
      'SOLUSDT',  // Solana

    ];
  }

}

export const backtestingService = new BacktestingService();
