import { __payloadCancelOrderType, __payloadCancelStoplossType, __payloadNewStoplossType, __payloadOpenOrderType } from "@src/payload/binance";

export interface BrokerInterface {
    readonly userId: number;
    readonly API_KEY: string;
    readonly API_SECRET: string;
    readonly API_PASSPHRASE: string | null;
    getPrice(token: string): Promise<number | undefined>;

    API_newOrder(p: __payloadOpenOrderType): Promise<{
        success: boolean;
        orderId?: string | number;
        entryPrice?: number;
        qty?: number;
        side?: "BUY" | "SELL";
        timestamp?: string;
    }>;

    API_closeOrder(p: __payloadCancelOrderType): Promise<{
        success: boolean;
        markPrice: number | null;
    }>;

    API_cancelStoploss(p: __payloadCancelStoplossType): Promise<any>;

    API_newStoploss(p: __payloadNewStoplossType): Promise<{
        success: boolean;
        orderId: string | number | null;
    }>;

    API_adjustLeverage(token: string, leverange: number): Promise<any>;

    API_getRecentFilledOrder(symbol: string, side: "BUY" | "SELL"): Promise<{ orderId: string | null }>;

    API_verifyOrder(
        symbol: string,
        orderId: string | number
    ): Promise<{
        success: boolean;
        entryPrice?: number;
        qty?: number;
        side?: "BUY" | "SELL";
        timestamp?: string;
        orderId?: string | number;
    }>;

    getLastNDayCandle(token: string, days: number): Promise<CandleType[] | null>;

    API_checkHasOpenPosition(symbol: string): Promise<boolean>;

    API_getFutureWalletBalance(): Promise<number>;
    getTakerFee(): number;
    getMakerFee(): number;
}

export type BrokerConstructor<T = any> = new (params: T) => BrokerInterface;
