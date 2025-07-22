import crypto from "crypto";

import { __payloadCancelOrderType, __payloadCancelStoplossType, __payloadNewStoplossType, __payloadOpenOrderType } from "@src/payload/binance";
import Timestamp from "@src/classes/timestamp";
import axiosService from "@src/axios";
import { writeLog } from "@src/utils/log";
import { setting } from "@src/setting";
import axios from "axios";

const buildSign: (data: string) => string = (data: string) => {
    return crypto
        .createHmac("sha256", process.env.BINANCE_SECRETKEY || "")
        .update(data)
        .digest("hex");
};

export const getServerTime = async () => {
    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/time`);
    if (response.status !== 200) {
        writeLog(["Error get server time", response]);
    }
    return response;
};

export const getListenKey = async () => {
    return await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/listenKey`, null, true);
};

export const pingKeepAliveListenKey = async (listenKey?: string, configHeader: boolean = false) => {
    return await axiosService.put(`${setting.BINANCE.BASE_URL_API}/fapi/v1/listenKey?listenKey=${listenKey}`, configHeader);
};

export const getPrice = async (token: string) => {
    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/premiumIndex?symbol=${token}`);

    if (response.status !== 200) {
        writeLog([`Error get price ${token}`, response]);
    }
    return response;
};

export const API_cancelStoploss = async (value: __payloadCancelStoplossType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&orderIdList=[${value.orderIds}]&recvWindow=60000`;
    const signature = buildSign(queryString);
    return await axiosService.delete(`${setting.BINANCE.BASE_URL_API}/fapi/v1/batchOrders?${queryString}&signature=${signature}`);
};

export const API_closeOrder = async (value: __payloadCancelOrderType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&side=${value.side}&type=MARKET&quantity=${value.qty}&reduceOnly=true&newOrderRespType=RESULT&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error cancel root order", `Query string: ${queryString}`]);
    }
    return response;
};

export const API_newStoploss = async (value: __payloadNewStoplossType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&side=${value.side}&type=${value.type}&quantity=${value.qty}&stopPrice=${value.stopPrice}&newOrderRespType=RESULT&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error new stoploss", `Query string: ${queryString}`]);
    }
    return response;
};

export const API_newOrder = async (value: __payloadOpenOrderType) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${value.token}&side=${value.side}&type=MARKET&quantity=${value.qty}&newOrderRespType=RESULT&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error new root order", `Query string: ${queryString}`, response]);
    }
    return response;
};

export const adjustLeverage = async (token: string, leverange: number) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `timestamp=${timestamp}&symbol=${token}&leverage=${leverange}&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.post(`${setting.BINANCE.BASE_URL_API}/fapi/v1/leverage?${queryString}&signature=${signature}`, null, true);
    if (response.status !== 200) {
        writeLog(["Error adjust leverage", `Leverage = ${leverange} Token ${token}`, response]);
    }
    return response;
};

export const getLast1HCandle = async (token: string) => {
    const now = new Date();
    now.setMinutes(0, 0, 0); // 04:01:00 becomes 04:00:00

    const to = now.getTime();
    const from = to - 60 * 60 * 1000;

    const url = `https://api.binance.com/api/v3/klines?symbol=${token}USDT&interval=1h&startTime=${from}&endTime=${to}&limit=1`;

    const response = await axios.get(url, { timeout: 5000 });
    if (response.status !== 200) {
        writeLog(["Error get last 1h candle", `Token ${token}`, response]);
    }
    return response;
};

export const getLastNDayCandle = async (token: string, days: number) => {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0); // Start of current UTC day

    const to = now.getTime(); // Start of current day
    const from = to - days * 24 * 60 * 60 * 1000; // Start of N days ago

    const url = `https://api.binance.com/api/v3/klines?symbol=${token}USDT&interval=1d&startTime=${from}&endTime=${to}`;

    try {
        const response = await axios.get(url, { timeout: 5000 });

        if (response.status !== 200) {
            writeLog(["Error get last N 1D candles", `Token ${token}`, response]);
            return null;
        }

        const candles: CandleType[] = response.data.map((candle: any[]) => ({
            Date: new Date(candle[0]).toISOString(),
            Open: parseFloat(candle[1]),
            High: parseFloat(candle[2]),
            Low: parseFloat(candle[3]),
            Close: parseFloat(candle[4]),
            Volume: parseFloat(candle[5]),
        }));

        return candles;
    } catch (error) {
        writeLog(["Exception get last N 1D candles", `Token ${token}`, error]);
        return null;
    }
};

export const API_getRecentFilledOrder = async (symbol: string) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `symbol=${symbol}&timestamp=${timestamp}&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/userTrades?${queryString}&signature=${signature}`, true);
    if (response.status !== 200) {
        console.log("Error API_getRecentFilledOrder", response);
        writeLog(["Error API_getRecentFilledOrder", `Symbol: ${symbol}`, response]);
    }
    return response;
};

export const API_getOpenPosition = async (symbol: string) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `symbol=${symbol}&timestamp=${timestamp}&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v2/positionRisk?${queryString}&signature=${signature}`, true);
    if (response.status !== 200) {
        console.log("Error get all open orders", response);
        writeLog(["Error get all open orders", `Symbol: ${symbol}`, response]);
    }
    return response;
};

export const API_verifyOrder = async (symbol: string, orderId: number) => {
    const timestamp = await new Timestamp().getTimestamp();
    const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}&recvWindow=60000`;
    const signature = buildSign(queryString);

    const response = await axiosService.get(`${setting.BINANCE.BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, true);
    if (response.status !== 200) {
        console.log("Error API_verifyOrder", response);
        writeLog(["Error API_verifyOrder", `Symbol: ${symbol}`, response]);
    }
    return response;
};
