type CandleType = {
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
};

type SystemSetting = {
    BINANCE: {
        BASE_URL_WEB_SOCKET: string;
        BASE_URL_API: string;
        TAKER_FEE: number;
    };
};

type HandleOpenRootOrderType = {
    strategyId: number;
    token: Token;
    qty: number;
    side: "BUY" | "SELL";
    user: User;
    firstTarget: Target;
    nextTarget: Target;
};

type OpenOrderType = {
    token: Token;
    strategy: Strategy;
    side: $Enums.Side;
    forSpecifyUserId?: number;
};

type HandleAfterOpenNewOrderType = {
    response: any;
    token: Token;
    strategyId: number;
    orderToken: string;
    user: User;
    firstTarget: Target;
    nextTarget: Target;
};

type UserBudgets = {
    userId: number;
    budget: number;
    commissionPercent: number;
    qty: number;
};

type CalculateOrderQtyType = {
    token: Token;
    strategyId: number;
    price: number;
    user: User;
    strategyBudgetPercent?: number;
};

type InsertOrderType = {
    response: any;
    nextTargetId: number;
    token: Token;
    strategyId: number;
    user: User;
};

type RecoverOrderParams = {
    symbol: string;
    side: "BUY" | "SELL";
    userId: number;
};

type NewStoploss = {
    target: Target;
    order: Order;
    token: Token;
    maxRetry?: number;
    delayMs?: number;
};

type __payloadCancelStoplossType {
    token: string;
    orderIds: string[];
}

type __payloadNewStoploss = {
    order: Order;
    token: Token;
    stoplossPercent: number;
};

type __payloadCancelOrderType = {
    token: string;
    side: "SELL" | "BUY";
    qty: number;
};

type __payloadOpenOrderType = {
    token: string;
    side: string;
    qty: number;
};

type __payloadNewStoplossType {
    token: string;
    side: "SELL" | "BUY";
    type: "TAKE_PROFIT_MARKET" | "STOP_MARKET" | "MARKET";
    qty: number;
    stopPrice: number;
}

type BacktestLogicType = {
    strategyId: number;
    data: { [date: string]: candleType };
    token: Token;
    timeFrame: "1d" | "4h" | "1h";
};

type BacktestCreateNewOrderType = {
    candle: candleType;
    entryPrice: number;
    isTrigger: boolean;
    side: "BUY" | "SELL";
    strategyId: number;
};

type BacktestCandleType = {
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
};

type BacktestOrderType = {
    id: number;
    entryTime: string;
    executedTime?: string; // Optional
    isTrigger: boolean;
    entryPrice: number;
    markPrice?: number; // Optional
    side: "BUY" | "SELL";
    stoplossIdx: number;
    strategyId: number;
    targets: Target[];
    trend: "MIXED" | "GREEN" | "RED";
};

type BacktestChartCandleType = {
    [date: string]: {
        candle: BacktestCandleType;
        executedOrder?: BacktestOrderType[];
        openOrderSide?: "BUY" | "SELL";
    };
};
