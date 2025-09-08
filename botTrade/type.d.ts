import { $Enums } from "@prisma/client";

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
    side: $Enums.Side;
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
    side: $Enums.Side;
    userId: number;
};

type NewStoploss = {
    target: Target;
    order: Order;
    token: Token;
    maxRetry?: number;
    delayMs?: number;
};

type __payloadCancelStoplossType = {
    symbol: string;
    orderIds: string[];
}

type __payloadNewStoploss = {
    order: Order;
    token: Token;
    stoplossPercent: number;
};

type __payloadCancelOrderType = {
    symbol: string;
    side: $Enums.Side;
    qty: number;
};

type __payloadOpenOrderType = {
    symbol: string;
    side: string;
    qty: number;
};

type __payloadNewStoplossType = {
    symbol: string;
    side: $Enums.Side;
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
    side: $Enums.Side;
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
    side: $Enums.Side;
    stoplossIdx: number;
    strategyId: number;
    targets: Target[];
};

type BacktestChartCandleType = {
    [date: string]: {
        candle: BacktestCandleType;
        executedOrder?: BacktestOrderType[];
        openOrderSide?: $Enums.Side;
    };
};

type SetStoplossType = {
    token: Token;
    order: Order;
    target: Target;
};

type CancelStoplossesType = {
    token: string;
    order: Order;
};

type calculateOrderQtyType = {
    token: Token;
    strategy: Strategy;
    price: number;
    user: User;
    strategyBudgetPercent?: number;
};

type __payloadCancelOrderType = {
    token: string;
    side: $Enums.Side;
    qty: number;
};

type __payloadCancelStoplossType = {
    token: string;
    orderIds: string[];
};

type __payloadNewStoplossType = {
    token: string;
    side: $Enums.Side;
    qty: number;
    stopPrice: number;
};

type __payloadOpenOrderType = {
    token: string;
    side: $Enums.Side;
    qty: number;
};