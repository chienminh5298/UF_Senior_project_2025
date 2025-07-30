import { __payloadCancelOrderType, __payloadCancelStoplossType, __payloadNewStoplossType, __payloadOpenOrderType } from "@src/payload/binance";
import { closeOrderManually } from "@src/handleOrders/handleOrder";
import { excutedStoploss } from "@src/handleOrders/handleStoploss";
import { BrokerInterface } from "@src/interface/broker";
import { logging, writeLog } from "@src/utils/log";
import axios, { AxiosResponse } from "axios";
import { removeUSDT } from "@src/utils";
import jsonbig from "json-bigint";
import crypto from "crypto";
import WebSocket from "ws";

const BASE_URL_API = "https://fapi.binance.com";
const BASE_URL_WEB_SOCKET = "wss://fstream.binance.com/stream";
const TAKER_FEE = 0.0005; // 0.05%

class Binance implements BrokerInterface {
    readonly userId: number;
    readonly API_KEY: string;
    readonly API_SECRET: string;
    readonly API_PASSPHRASE: string | null;
    private listenKey?: string;
    private timestamp?: string;
    private header: { [key: string]: string };
    private TAKER_FEE: number;
    private MAKER_FEE: number;

    constructor({ userId, API_KEY, API_SECRET, API_PASSPHRASE, skipDecrypt = false }: { userId: number; API_KEY: string; API_SECRET: string; API_PASSPHRASE: string | null; skipDecrypt?: boolean }) {
        this.userId = userId;
        this.API_KEY = API_KEY;
        this.API_SECRET = API_SECRET;
        this.API_PASSPHRASE = API_PASSPHRASE;
        this.header = {
            "x-mbx-apikey": API_KEY,
        };

        this.TAKER_FEE = 0.0005;
        this.MAKER_FEE = 0.0005;
    }

    private boot = async () => {
        // Initialize if needed
        // await this.getTimestamp();
        // await this.getListenKey();
        // this.API_socketEventDriven();
    };
    private buildSign: (data: string) => string = (data: string) => {
        return crypto
            .createHmac("sha256", this.API_SECRET || "")
            .update(data)
            .digest("hex");
    };

    private API_getListenKey = async () => {
        let attempts = 0;
        while (attempts < 3 && !this.listenKey) {
            const response = await axios.post(`${BASE_URL_API}/fapi/v1/listenKey`, null, this.header);
            if (response.status === 200) {
                this.listenKey = response.data.listenKey;
                logging("info", `Get listen key successful.`);

                // Update listen key after every 45 mins, listen key will expirate after 1 hour without refresh
                setInterval(async () => {
                    await this.updateListenKey();
                }, 2700000);
                break;
            } else {
                writeLog([`Can't get listen key`, response]);
                logging("warning", `Can't get listen key, trying again ...`);
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 second before retrying
                attempts++;
            }
        }
        if (attempts >= 3 && !this.listenKey) {
            logging("error", `Can't get listen key after 4 times, problem could be VPN please check again...`);
            process.exit();
        }
    };

    private pingKeepAliveListenKey = async (listenKey?: string) => {
        return await axios.put(`${BASE_URL_API}/fapi/v1/listenKey?listenKey=${listenKey}`, this.header);
    };

    private updateListenKey = async () => {
        var response: AxiosResponse = await this.pingKeepAliveListenKey(this.listenKey);
        while (response.status !== 200) {
            logging("warning", `Can't update listen key, trying again ...`);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 second before retrying
            response = await this.pingKeepAliveListenKey(this.listenKey);
        }
        this.listenKey = response.data.listenKey;
    };

    private updateTimestamp = async () => {
        var response: AxiosResponse = await this.getServerTime();
        while (response.status !== 200) {
            console.log(response);
            logging("warning", `Can't update timestamp, trying again ...`);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 second before retrying
            response = await this.getServerTime();
        }

        this.timestamp = response.data.serverTime;
    };

    private API_getTimestamp = async () => {
        let attempts = 0;
        while (attempts <= 3 && !this.timestamp) {
            const response: AxiosResponse = await this.getServerTime();
            if (response.status === 200) {
                this.timestamp = response.data.serverTime;
                logging("info", `Get timestamp successful.`);

                // Update listen key after every 30 secs, listen key will expirate after 1 hour without refresh
                setInterval(async () => {
                    await this.updateTimestamp();
                }, 30000);
                break;
            } else {
                logging("warning", `Can't get timestamp, trying again ...`);
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 1 second before retrying
                attempts++;
            }
        }
        if (attempts >= 3 && this.timestamp) {
            logging("error", `Can't get timestamp after 4 times, please check again.`);
            process.exit();
        }
    };

    private getServerTime = async () => {
        const response = await axios.get(`${BASE_URL_API}/fapi/v1/time`);
        if (response.status !== 200) {
            writeLog(["Error get server time", response]);
        }
        return response;
    };

    private getTimestamp = async () => {
        if (!this.timestamp) {
            await this.API_getTimestamp();
        }
        return this.timestamp;
    };

    private API_socketEventDriven = async () => {
        const URI = `${BASE_URL_WEB_SOCKET}?streams=${this.listenKey}`;
        var socket = new WebSocket(URI);

        const attempReconnect = () => {
            setTimeout(() => {
                this.API_socketEventDriven();
            }, 3000);
        };

        socket.on("open", () => {
            logging("info", "Binance socket open successfuly.");
        });

        socket.on("message", async (msg: WebSocket.RawData) => {
            const { e, o } = jsonbig.parse(msg.toString()).data as any;

            if (e !== "ORDER_TRADE_UPDATE") return;

            /* ─── Stop-loss / Take-profit hit ───────────────────── */
            if (
                o.x === "TRADE" && // executionReport
                o.X === "FILLED" && // khớp 100 %
                o.R === true && // reduce-only
                (o.ot === "STOP_MARKET" || o.ot === "TAKE_PROFIT_MARKET")
            ) {
                const orderId = jsonbig.stringify(o.i); // [o.i] is orderId
                const markPrice = parseFloat(o.ap); // [o.ap] is average price

                await excutedStoploss(orderId, markPrice);
                return;
            }

            /* ─── Đóng tay trên Web UI ──────────────────────────── */
            if (
                o.x === "TRADE" &&
                o.X === "FILLED" &&
                o.R === true &&
                o.ot === "MARKET" && // lệnh market thuần
                o.c?.includes("web") // clientOrderId do Web gán
            ) {
                const token = removeUSDT(o.s);
                const markPrice = parseFloat(o.ap); // [o.ap] is average price
                await closeOrderManually(token, markPrice, 0);
            }
        });

        socket.on("error", (error) => {
            logging("error", `Binance order socket failed: ${jsonbig.parse(error.toString())}`);
            attempReconnect();
        });

        socket.on("close", () => {
            logging("warning", `Binance order socket disconnected`);
            attempReconnect();
        });
    };

    getTakerFee = () => {
        return this.TAKER_FEE;
    };

    getMakerFee = () => {
        return this.MAKER_FEE;
    };

    getListenKey = async () => {
        if (!this.listenKey) {
            await this.API_getListenKey();
        }
        return this.listenKey;
    };

    getPrice = async (token: string) => {
        const response = await axios.get(`${BASE_URL_API}/fapi/v1/premiumIndex?symbol=${token}`);

        if (response.status !== 200) {
            writeLog([`Error get price ${token}`, response]);
            return undefined;
        }
        return parseFloat(response.data.markPrice);
    };

    API_cancelStoploss = async (value: __payloadCancelStoplossType) => {
        const queryString = `timestamp=${this.timestamp}&symbol=${value.token}&orderIdList=[${value.orderIds}]&recvWindow=60000`;
        const signature = this.buildSign(queryString);
        return await axios.delete(`${BASE_URL_API}/fapi/v1/batchOrders?${queryString}&signature=${signature}`, this.header);
    };

    API_closeOrder = async (value: __payloadCancelOrderType) => {
        const queryString = `timestamp=${this.timestamp}&symbol=${value.token}&side=${value.side}&type=MARKET&quantity=${value.qty}&reduceOnly=true&newOrderRespType=RESULT&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.post(`${BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, this.header);
        if (response.status !== 200) {
            writeLog(["Error cancel root order", `Query string: ${queryString}`]);
            return { success: false, markPrice: null };
        }
        return { success: true, markPrice: response.data.avgPrice };
    };

    API_newStoploss = async (value: __payloadNewStoplossType) => {
        const queryString = `timestamp=${this.timestamp}&symbol=${value.token}&side=${value.side}&type=STOP_MARKET&quantity=${value.qty}&stopPrice=${value.stopPrice}&newOrderRespType=RESULT&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.post(`${BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, this.header);
        if (response.status !== 200) {
            writeLog(["Error new stoploss", `Query string: ${queryString}`]);
            return { success: false, orderId: null };
        }
        return { success: true, orderId: response.data.orderId };
    };

    API_newOrder = async (value: __payloadOpenOrderType) => {
        const queryString = `timestamp=${this.timestamp}&symbol=${value.token}&side=${value.side}&type=MARKET&quantity=${value.qty}&newOrderRespType=RESULT&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.post(`${BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, null, this.header);
        if (response.status !== 200) {
            writeLog(["Error new root order", `Query string: ${queryString}`, response]);
            return { success: false };
        }
        return {
            success: true,
            orderId: response.data.orderId,
            entryPrice: parseFloat(response.data.avgPrice),
            qty: parseFloat(response.data.origQty),
            side: response.data.side,
            timestamp: response.data.updateTime.toString(),
        };
    };

    API_adjustLeverage = async (token: string, leverange: number) => {
        const queryString = `timestamp=${this.timestamp}&symbol=${token}&leverage=${leverange}&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.post(`${BASE_URL_API}/fapi/v1/leverage?${queryString}&signature=${signature}`, null, this.header);
        if (response.status !== 200) {
            writeLog(["Error adjust leverage", `Leverage = ${leverange} Token ${token}`, response]);
        }
    };

    getLastNDayCandle = async (token: string, days: number) => {
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

    API_getRecentFilledOrder = async (symbol: string, side: "BUY" | "SELL"): Promise<{ orderId: string | null }> => {
        const queryString = `symbol=${symbol}&timestamp=${this.timestamp}&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.get(`${BASE_URL_API}/fapi/v1/userTrades?${queryString}&signature=${signature}`, this.header);
        if (response.status !== 200) {
            console.log("Error API_getRecentFilledOrder", response);
            writeLog(["Error API_getRecentFilledOrder", `Symbol: ${symbol}`, response]);
            return { orderId: null };
        }

        const trades = response.data;
        const latestSideTrade = trades.filter((t: any) => t.side === side).sort((a: any, b: any) => b.time - a.time)[0];
        if (!latestSideTrade) {
            console.log(`Error recoverLatestOpenOrder step 2 ${symbol}`);
            return { orderId: null };
        }
        const orderId = latestSideTrade.orderId;
        return { orderId };
    };

    API_checkHasOpenPosition = async (symbol: string) => {
        const queryString = `symbol=${symbol}&timestamp=${this.timestamp}&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.get(`${BASE_URL_API}/fapi/v2/positionRisk?${queryString}&signature=${signature}`, this.header);
        if (response.status !== 200) {
            console.log("Error get all open orders", response);
            writeLog(["Error get all open orders", `Symbol: ${symbol}`, response]);
        }

        const positionData = response?.data?.[0]; // lấy phần tử đầu tiên

        const positionAmt = Number(positionData?.positionAmt || 0);
        return positionAmt !== 0 ? true : false;
    };

    API_getFutureWalletBalance = async () => {
        return 0;
    };

    API_verifyOrder = async (symbol: string, orderId: number) => {
        const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${this.timestamp}&recvWindow=60000`;
        const signature = this.buildSign(queryString);

        const response = await axios.get(`${BASE_URL_API}/fapi/v1/order?${queryString}&signature=${signature}`, this.header);
        if (response.status !== 200) {
            console.log("Error API_verifyOrder", response);
            writeLog(["Error API_verifyOrder", `Symbol: ${symbol}`, response]);
            return { success: false };
        }
        const status = response.data.status;
        if (status !== "FILLED") {
            console.log(`Error recoverLatestOpenOrder step 3 ${symbol}`);
            return { success: false };
        }

        return {
            success: true,
            orderId: response.data.orderId,
            entryPrice: parseFloat(response.data.avgPrice),
            qty: parseFloat(response.data.origQty),
            side: response.data.side,
            timestamp: response.data.updateTime.toString(),
        };
    };
}

export default Binance;
