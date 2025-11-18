import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample price data (used as fallback if no WebSocket data available)
// Keys must match Token.name in the database (BTC, ETH, SOL, etc.)
const SAMPLE_PRICES: Record<string, number> = {
  BTC: 45000.0,
  ETH: 3200.0,
  ADA: 0.45,
  SOL: 95.0,
  MATIC: 0.85,
  LINK: 15.5,
};

// Price change simulation for fallback prices
const PRICE_CHANGES: Record<string, { min: number; max: number }> = {
  BTC: { min: -0.05, max: 0.05 },
  ETH: { min: -0.08, max: 0.08 },
  ADA: { min: -0.12, max: 0.12 },
  SOL: { min: -0.1, max: 0.1 },
  MATIC: { min: -0.15, max: 0.15 },
  LINK: { min: -0.09, max: 0.09 },
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

  async getTokenPrice(tokenName: string): Promise<TokenPrice> {
    const cached = this.priceCache.get(tokenName);
    const now = new Date();

    if (
      cached &&
      now.getTime() - cached.lastUpdated.getTime() < 5 * 60 * 1000
    ) {
      return cached;
    }

    // Fallback to sample data if no WebSocket data available
    const basePrice = SAMPLE_PRICES[tokenName] || 100;
    const changeRange = PRICE_CHANGES[tokenName] || { min: -0.1, max: 0.1 };
    const changePercent =
      changeRange.min + Math.random() * (changeRange.max - changeRange.min);
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

    if (!cached) {
      this.priceCache.set(tokenName, tokenPrice);
    }

    return tokenPrice;
  }

  async getTokenPrices(tokenNames: string[]): Promise<TokenPrice[]> {
    const prices = await Promise.all(
      tokenNames.map((name) => this.getTokenPrice(name))
    );
    return prices;
  }

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
      unrealizedPnL =
        (tokenPrice.currentPrice - order.entryPrice) * order.quantity;
      unrealizedPnLPercent =
        ((tokenPrice.currentPrice - order.entryPrice) / order.entryPrice) * 100;
    } else {
      unrealizedPnL =
        (order.entryPrice - tokenPrice.currentPrice) * order.quantity;
      unrealizedPnLPercent =
        ((order.entryPrice - tokenPrice.currentPrice) / order.entryPrice) * 100;
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

  async calculateOrdersPnL(
    orders: Array<{
      id: number;
      tokenName: string;
      entryPrice: number;
      quantity: number;
      side: 'BUY' | 'SELL';
    }>
  ): Promise<OrderPnL[]> {
    const pnlPromises = orders.map((order) => this.calculateOrderPnL(order));
    return Promise.all(pnlPromises);
  }

  async getActiveOrdersWithPnL(): Promise<
    Array<
      OrderPnL & {
        userId: number;
        userEmail: string;
        status: string;
        buyDate: Date;
        strategy?: string;
      }
    >
  > {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: 'ACTIVE',
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
          },
        },
        token: {
          select: {
            name: true,
          },
        },
        strategy: {
          select: {
            description: true,
          },
        },
      },
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

  async getTotalUnrealizedPnL(): Promise<{
    totalUnrealizedPnL: number;
    totalUnrealizedPnLPercent: number;
    orderCount: number;
    lastUpdated: Date;
  }> {
    const ordersWithPnL = await this.getActiveOrdersWithPnL();

    const totalUnrealizedPnL = ordersWithPnL.reduce(
      (sum, order) => sum + order.unrealizedPnL,
      0
    );
    const orderCount = ordersWithPnL.length;
    const lastUpdated =
      ordersWithPnL.length > 0 ? ordersWithPnL[0].lastUpdated : new Date();

    const totalUnrealizedPnLPercent =
      orderCount > 0
        ? ordersWithPnL.reduce(
            (sum, order) => sum + order.unrealizedPnLPercent,
            0
          ) / orderCount
        : 0;

    return {
      totalUnrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100,
      totalUnrealizedPnLPercent:
        Math.round(totalUnrealizedPnLPercent * 100) / 100,
      orderCount,
      lastUpdated,
    };
  }

  clearCache(): void {
    this.priceCache.clear();
    this.lastUpdate = new Date();
  }

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

  updatePrice(tokenPrice: TokenPrice): void {
    this.priceCache.set(tokenPrice.tokenName, tokenPrice);
    this.lastUpdate = new Date();
  }
}

export const priceService = new PriceService();
export default priceService;
