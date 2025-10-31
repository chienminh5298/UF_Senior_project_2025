import WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';
import { priceService, TokenPrice } from './priceService';

const prisma = new PrismaClient();

// Map token names to Binance symbols (all symbols must be lowercase)
const TOKEN_TO_SYMBOL: Record<string, string> = {
  Bitcoin: 'btcusdt',
  Ethereum: 'ethusdt',
  Cardano: 'adausdt',
  Solana: 'solusdt',
  Polygon: 'maticusdt',
  Chainlink: 'linkusdt',
};

// Reverse map: Binance symbol (lowercase) to token name
const SYMBOL_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_TO_SYMBOL).map(([token, symbol]) => [symbol.toLowerCase(), token])
);

interface BinanceTickerData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  c: string; // Last price
  Q: string; // Last quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade Id
  n: number; // Total number of trades
}

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000;
  private readonly CONNECTION_MAX_AGE = 23 * 60 * 60 * 1000;
  private connectionStartTime: Date | null = null;
  private reconnectBeforeExpiryInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private activeTokenSymbols = new Set<string>();
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Get active tokens from database and map to Binance symbols
   */
  private async getActiveTokenSymbols(): Promise<Set<string>> {
    try {
      const activeTokens = await prisma.token.findMany({
        where: { isActive: true },
        select: { name: true },
      });

      const symbols = new Set<string>();
      for (const token of activeTokens) {
        const symbol = TOKEN_TO_SYMBOL[token.name];
        if (symbol) {
          symbols.add(symbol.toLowerCase());
        }
      }

      return symbols;
    } catch (error) {
      console.error('Error fetching active tokens:', error);
      return new Set<string>();
    }
  }

  /**
   * Connect to Binance WebSocket stream
   */
  async connect(): Promise<void> {
    try {

      this.activeTokenSymbols = await this.getActiveTokenSymbols();

      if (this.activeTokenSymbols.size === 0) {
        console.log('No active tokens found, skipping WebSocket connection');
        return;
      }

      console.log(
        `Connecting to Binance WebSocket for ${this.activeTokenSymbols.size} active tokens...`
      );

      const wsUrl = 'wss://fstream.binance.com/ws/!ticker@arr';

      this.ws = new WebSocket(wsUrl);
      
      this.connectionStartTime = new Date();

      this.ws.on('open', () => {
        if (!this.ws) return;
        
        console.log('Connected to Binance WebSocket stream');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionStartTime = new Date();
        
        this.setupPingPong();
        
        this.scheduleReconnectBeforeExpiry();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        if (!this.ws) return;
        
        try {
          if (data.toString() === 'ping') {
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.send('pong');
            }
            return;
          }

          const tickers: BinanceTickerData[] = JSON.parse(data.toString());
          this.handleTickerUpdate(tickers);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      this.ws.on('ping', () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.pong(() => {
          });
        }
      });

      this.ws.on('error', (error: Error) => {
        console.error('Binance WebSocket error:', error);
        this.isConnected = false;
      });

      this.ws.on('close', () => {
        console.log('Binance WebSocket connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });
    } catch (error) {
      console.error('Error connecting to Binance WebSocket:', error);
      this.handleReconnect();
    }
  }

  /**
   * Handle ticker updates from WebSocket
   */
  private handleTickerUpdate(tickers: BinanceTickerData[]): void {
    for (const ticker of tickers) {
      const symbolLower = ticker.s.toLowerCase();
      
      if (!this.activeTokenSymbols.has(symbolLower)) {
        continue;
      }

      const tokenName = SYMBOL_TO_TOKEN[symbolLower];
      if (!tokenName) {
        continue;
      }

      const currentPrice = parseFloat(ticker.c);
      const priceChange = parseFloat(ticker.p);
      const priceChangePercent = parseFloat(ticker.P);

      const tokenPrice: TokenPrice = {
        tokenName,
        currentPrice,
        priceChange,
        priceChangePercent,
        lastUpdated: new Date(),
      };

      priceService.updatePrice(tokenPrice);
    }
  }
  
  /**
   * Setup ping/pong handling
   * Binance sends ping every 3 minutes, client must respond with pong
   */
  private setupPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.pong(() => {
        });
      }
    }, 5 * 60 * 1000);
  }
  
  /**
   * Schedule reconnection before 24-hour expiry
   */
  private scheduleReconnectBeforeExpiry(): void {
    if (this.reconnectBeforeExpiryInterval) {
      clearInterval(this.reconnectBeforeExpiryInterval);
    }

    this.reconnectBeforeExpiryInterval = setTimeout(() => {
      console.log('Reconnecting before 24-hour expiry...');
      this.disconnect();
      this.connect();
    }, this.CONNECTION_MAX_AGE);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectInterval) {
      return;
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error(
        `Max reconnection attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection.`
      );
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}) in ${this.RECONNECT_DELAY}ms...`
    );

    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      this.connect();
    }, this.RECONNECT_DELAY);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.reconnectBeforeExpiryInterval) {
      clearTimeout(this.reconnectBeforeExpiryInterval);
      this.reconnectBeforeExpiryInterval = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.connectionStartTime = null;
    console.log('Binance WebSocket disconnected');
  }

  /**
   * Refresh active tokens list (useful when tokens are activated/deactivated)
   */
  async refreshActiveTokens(): Promise<void> {
    this.activeTokenSymbols = await this.getActiveTokenSymbols();
    console.log(
      `Refreshed active tokens: ${this.activeTokenSymbols.size} symbols`
    );
  }

  /**
   * Get connection status
   */
  getStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    activeTokenCount: number;
    connectionAge?: number;
    connectionAgeHours?: number;
  } {
    const connectionAge = this.connectionStartTime
      ? Date.now() - this.connectionStartTime.getTime()
      : undefined;

    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      activeTokenCount: this.activeTokenSymbols.size,
      connectionAge,
      connectionAgeHours: connectionAge
        ? Math.round((connectionAge / (1000 * 60 * 60)) * 100) / 100
        : undefined,
    };
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
export default binanceWebSocketService;

