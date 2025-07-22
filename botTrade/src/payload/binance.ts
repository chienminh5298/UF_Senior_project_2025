import { calculateMarkPrice, roundQtyToNDecimal, roundStopPriceTo2Decimals } from "@src/utils";
import { Order, Token } from "@prisma/client";

export interface __payloadCancelStoplossType {
    token: string;
    orderIds: string[];
}

export const __payloadCancelStoploss = (query: __payloadCancelStoplossType) => {
    return {
        symbol: query.token, // ETHUSDT,... (With 'USDT')
        orderIds: query.orderIds,
    };
};

export interface __payloadNewStoplossType {
    token: string;
    side: "SELL" | "BUY";
    type: "TAKE_PROFIT_MARKET" | "STOP_MARKET" | "MARKET";
    qty: number;
    stopPrice: number;
}

type __payloadNewStoploss = {
    order: Order;
    token: Token;
    stoplossPercent: number;
};

export const __payloadNewStoploss = ({ order, token, stoplossPercent }: __payloadNewStoploss) => {
    const tokenUSDT = token.name + token.stable;
    const qty = roundQtyToNDecimal(order.qty, token.minQty);
    const side = order.side === "short" ? "BUY" : ("SELL" as "SELL" | "BUY");
    const stopPrice = roundStopPriceTo2Decimals(calculateMarkPrice(stoplossPercent, order.entryPrice, order.side));
    return {
        token: tokenUSDT,
        side,
        type: "STOP_MARKET" as "STOP_MARKET",
        qty,
        stopPrice,
    };
};

export type __payloadCancelOrderType = {
    token: string;
    side: "SELL" | "BUY";
    qty: number;
};

export const __payloadCloseOrder = (query: __payloadCancelOrderType, minQty: number) => {
    return {
        token: query.token,
        side: query.side,
        qty: roundQtyToNDecimal(query.qty, minQty),
    };
};

export type __payloadOpenOrderType = {
    token: string;
    side: string;
    qty: number;
};

export const __payloadNewOrder = (query: __payloadOpenOrderType, minQty: number) => {
    return {
        token: query.token,
        side: query.side === "short" ? "SELL" : "BUY",
        qty: roundQtyToNDecimal(query.qty, minQty),
    };
};
