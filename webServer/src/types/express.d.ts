export interface JwtUser {
  id: number;
  email: string;
}

type BacktestLogicType = {
    strategyId: number;
    data: { [date: string]: candleType };
    token: Token;
    timeFrame: "1d" | "4h" | "1h";
};

type candleType = {
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
};

type IndexedCandle = candleType & { ts: number };

type ChartCandleType = {
    [date: string]: {
        candle: candleType;
        executedOrder?: OrderType[];
        openOrderSide?: $Enums.Side;
    };
};

type OrderType = {
    id: number;
    entryTime: string;
    executedTime?: string; // Optional
    isTrigger: boolean;
    entryPrice: number;
    markPrice?: number; // Optional
    side: $Enums.Side;
    stoplossIdx: number;
    strategyId: number;
    targets: Target[];
    trend: "MIXED" | "GREEN" | "RED";
};

type CreateNewOrderType = {
    candle: candleType;
    entryPrice: number;
    isTrigger: boolean;
    side: $Enums.Side;
    strategyId: number;
};
