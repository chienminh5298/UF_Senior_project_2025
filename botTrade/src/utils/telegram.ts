import axios from "axios";

export const sendTelegramMessage = async (message: string) => {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, { chat_id: process.env.TELEGRAM_CHAT_ID, text: message });
};

export const sendTelegramAdminMessage = async (message: string) => {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, { chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID, text: message });
};

type NewOrderType = {
    entryTime: string | Date;
    entryPrice: number;
    targetPrice: number;
    stoplossPrice: number;
    orderId: number | string;
    side: "short" | "long";
};
export const telegramNewOrderPayload = ({ entryTime, entryPrice, targetPrice, stoplossPrice, orderId, side }: NewOrderType) => {
    return `✅ Order Placed Successfully!
    Time: ${entryTime}
    Order id: ${orderId}
    Side: ${side.toLocaleUpperCase()}
    Buy at: ${entryPrice}
    `;
};

type MoveStoplossType = {
    entryTime: string | Date;
    targetPrice: number;
    stoplossPrice: number;
    orderId: number | string;
    side: "short" | "long";
};
export const telegramMoveStoplossPayload = ({ entryTime, targetPrice, stoplossPrice, orderId, side }: MoveStoplossType) => {
    return `🚀 Move stoploss!
    Time: ${entryTime}
    Order id: ${orderId}
    Side: ${side.toLocaleUpperCase()}
    `;
};

type HitStoplossType = {
    entryTime: string | Date;
    stoplossPrice: number;
    orderId: number | string;
    entryPrice: number;
    side: "short" | "long";
};
export const telegramHitStoplossPayload = ({ entryTime, stoplossPrice, orderId, entryPrice, side }: HitStoplossType) => {
    return `💥 Stoploss hit
    Time: ${entryTime}
    Order id: ${orderId}
    Side: ${side.toLocaleUpperCase()}
    Buy at: ${entryPrice.toFixed(2)}
    Sell at: ${stoplossPrice.toFixed(2)}
    `;
};

type HitTargetType = {
    entryTime: string | Date;
    entryPrice: number;
    executedPrice: number;
    orderId: number | string;
    side: "short" | "long";
};
export const telegramHitTargetPayload = ({ entryTime, orderId, entryPrice, executedPrice, side }: HitTargetType) => {
    return `🎯 Target hit
    Time: ${entryTime}
    Order id: ${orderId}
    Side: ${side.toLocaleUpperCase()}
    Buy at: ${entryPrice.toFixed(2)}
    Sell at: ${executedPrice.toFixed(2)}
    `;
};
