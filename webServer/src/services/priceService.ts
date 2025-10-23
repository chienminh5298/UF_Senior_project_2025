import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample price data - in production, this would come from external APIs like Binance, CoinGecko, etc.
const SAMPLE_PRICES: Record<string, number> = {
  'Bitcoin': 45000.00,
  'Ethereum': 3200.00,
  'Cardano': 0.45,
  'Solana': 95.00,
  'Polygon': 0.85,
  'Chainlink': 15.50,
};

// Price change simulation for demo purposes
const PRICE_CHANGES: Record<string, { min: number; max: number }> = {
  'Bitcoin': { min: -0.05, max: 0.05 }, // ±5%
  'Ethereum': { min: -0.08, max: 0.08 }, // ±8%
  'Cardano': { min: -0.12, max: 0.12 }, // ±12%
  'Solana': { min: -0.10, max: 0.10 }, // ±10%
  'Polygon': { min: -0.15, max: 0.15 }, // ±15%
  'Chainlink': { min: -0.09, max: 0.09 }, // ±9%
};

export interface TokenPrice {
  tokenName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: Date;
}

export interface OrderPnL {
  orderId: number;
  tokenName: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  lastUpdated: Date;
}

class PriceService {
  private priceCache: Map<string, TokenPrice> = new Map();
  private lastUpdate: Date = new Date();

  /**
   * Get current price for a token
   */
  async getTokenPrice(tokenName: string): Promise<TokenPrice> {
    const cached = this.priceCache.get(tokenName);
    const now = new Date();
    
    // Return cached price if it's less than 30 seconds old
    if (cached && (now.getTime() - cached.lastUpdated.getTime()) < 30000) {
      return cached;
    }

    // Generate new price with some volatility
    const basePrice = SAMPLE_PRICES[tokenName] || 100;
    const changeRange = PRICE_CHANGES[tokenName] || { min: -0.1, max: 0.1 };
    const changePercent = changeRange.min + Math.random() * (changeRange.max - changeRange.min);
    const currentPrice = basePrice * (1 + changePercent);
    const priceChange = currentPrice - basePrice;
    const priceChangePercent = (priceChange / basePrice) * 100;

    const tokenPrice: TokenPrice = {
      tokenName,
      currentPrice: Math.round(currentPrice * 100) / 100,
      priceChange: Math.round(priceChange * 100) / 100,
      priceChangePercent: Math.round(priceChangePercent * 100) / 100,
      lastUpdated: now,
    };

    this.priceCache.set(tokenName, tokenPrice);
    return tokenPrice;
  }

  /**
   * Get prices for multiple tokens
   */
  async getTokenPrices(tokenNames: string[]): Promise<TokenPrice[]> {
    const prices = await Promise.all(
      tokenNames.map(name => this.getTokenPrice(name))
    );
    return prices;
  }

  /**
   * Calculate real-time P&L for an order
   */
  async calculateOrderPnL(order: {
    id: number;
    tokenName: string;
    entryPrice: number;
    quantity: number;
    side: 'BUY' | 'SELL';
  }): Promise<OrderPnL> {
    const tokenPrice = await this.getTokenPrice(order.tokenName);
    
    let unrealizedPnL: number;
    let unrealizedPnLPercent: number;

    if (order.side === 'BUY') {
      // For BUY orders: profit when current price > entry price
      unrealizedPnL = (tokenPrice.currentPrice - order.entryPrice) * order.quantity;
      unrealizedPnLPercent = ((tokenPrice.currentPrice - order.entryPrice) / order.entryPrice) * 100;
    } else {
      // For SELL orders: profit when current price < entry price
      unrealizedPnL = (order.entryPrice - tokenPrice.currentPrice) * order.quantity;
      unrealizedPnLPercent = ((order.entryPrice - tokenPrice.currentPrice) / order.entryPrice) * 100;
    }

    return {
      orderId: order.id,
      tokenName: order.tokenName,
      entryPrice: order.entryPrice,
      currentPrice: tokenPrice.currentPrice,
      quantity: order.quantity,
      side: order.side,
      unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
      unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
      lastUpdated: tokenPrice.lastUpdated,
    };
  }

  /**
   * Calculate P&L for multiple orders
   */
  async calculateOrdersPnL(orders: Array<{
    id: number;
    tokenName: string;
    entryPrice: number;
    quantity: number;
    side: 'BUY' | 'SELL';
  }>): Promise<OrderPnL[]> {
    const pnlPromises = orders.map(order => this.calculateOrderPnL(order));
    return Promise.all(pnlPromises);
  }

  /**
   * Get all active orders with real-time P&L
   */
  async getActiveOrdersWithPnL(): Promise<Array<OrderPnL & { 
    userId: number;
    userEmail: string;
    status: string;
    buyDate: Date;
    strategy?: string;
  }>> {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        entryPrice: true,
        qty: true,
        side: true,
        buyDate: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
          }
        },
        token: {
          select: {
            name: true,
          }
        },
        strategy: {
          select: {
            description: true,
          }
        }
      }
    });

    const ordersWithPnL = await Promise.all(
      activeOrders.map(async (order) => {
        const pnl = await this.calculateOrderPnL({
          id: order.id,
          tokenName: order.token?.name || 'Unknown',
          entryPrice: order.entryPrice,
          quantity: order.qty,
          side: order.side as 'BUY' | 'SELL',
        });

        return {
          ...pnl,
          userId: order.user?.id || 0,
          userEmail: order.user?.email || 'Unknown',
          status: order.status,
          buyDate: order.buyDate,
          strategy: order.strategy?.description,
        };
      })
    );

    return ordersWithPnL;
  }

  /**
   * Get total unrealized P&L for all active orders
   */
  async getTotalUnrealizedPnL(): Promise<{
    totalUnrealizedPnL: number;
    totalUnrealizedPnLPercent: number;
    orderCount: number;
    lastUpdated: Date;
  }> {
    const ordersWithPnL = await this.getActiveOrdersWithPnL();
    
    const totalUnrealizedPnL = ordersWithPnL.reduce((sum, order) => sum + order.unrealizedPnL, 0);
    const orderCount = ordersWithPnL.length;
    const lastUpdated = ordersWithPnL.length > 0 ? ordersWithPnL[0].lastUpdated : new Date();

    // Calculate weighted average percentage
    const totalUnrealizedPnLPercent = orderCount > 0 
      ? ordersWithPnL.reduce((sum, order) => sum + order.unrealizedPnLPercent, 0) / orderCount
      : 0;

    return {
      totalUnrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100,
      totalUnrealizedPnLPercent: Math.round(totalUnrealizedPnLPercent * 100) / 100,
      orderCount,
      lastUpdated,
    };
  }

  /**
   * Clear price cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.priceCache.clear();
    this.lastUpdate = new Date();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cacheSize: number;
    lastUpdate: Date;
    cachedTokens: string[];
  } {
    return {
      cacheSize: this.priceCache.size,
      lastUpdate: this.lastUpdate,
      cachedTokens: Array.from(this.priceCache.keys()),
    };
  }
}

// Export singleton instance
export const priceService = new PriceService();
export default priceService;
