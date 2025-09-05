import { closeOrderManually } from "@src/handleOrders/handleOrder";
import { excutedStoploss } from "@src/handleOrders/handleStoploss";
import { BrokerInterface } from "@src/interface/broker";
import { logging, writeLog } from "@src/utils/log";
import axios, { AxiosResponse } from "axios";
import { handleError, removeUSDT } from "@src/utils";
import jsonbig from "json-bigint";
import crypto from "crypto";
import WebSocket from "ws";
import targetStorageInstance from "../classes/targetStorage";

class Binance implements BrokerInterface {
    readonly userId: number;
    readonly API_KEY: string;
    readonly API_SECRET: string;
    readonly API_PASSPHRASE: string | null; // not used on Binance, kept for interface parity
    private TAKER_FEE: number;
    private MAKER_FEE: number;

    private BASE_URL_API = "https://fapi.binance.com";
    private BASE_URL_WS = "wss://fstream.binance.com/ws";
    private timeOffsetMs = 0;
    private lastTimeSync = 0;
    private listenKey: string | null = null;
    private listenKeyKeepAlive?: NodeJS.Timeout;
    private ws?: WebSocket;

    private readonly RECV_WINDOW = 10_000;
    private readonly CLOSE_ORDER_CID_PREFIX = "MM_CLOSE_";
    private readonly OPEN_ORDER_CID_PREFIX = "MM_OPEN_";

    constructor({ userId, API_KEY, API_SECRET, API_PASSPHRASE }: { userId: number; API_KEY: string; API_SECRET: string; API_PASSPHRASE: string | null }) {
        this.userId = userId;
        this.API_KEY = API_KEY;
        this.API_SECRET = API_SECRET;
        this.API_PASSPHRASE = API_PASSPHRASE;

        // Typical default fees (can be overridden by your account tier)
        this.TAKER_FEE = 0.0005;
        this.MAKER_FEE = 0.0005;

        this.boot();
    }

    private boot = async () => {
        await this.updateTimestamp(); // preload server-time & keep fresh
        this.stoplossPoll(); // fallback in case WS misses events
        this.API_socketEventDriven(); // start user data stream WS
    };

    private nowMs = () => String(Date.now() + this.timeOffsetMs);

    private ensureFreshTime = async () => {
        if (Date.now() - this.lastTimeSync > 25_000) {
            // keep <30s window
            await this.updateTimestamp();
        }
    };

    /* -------------------------------- Sign & Headers -------------------------------- */

    private buildQS = (params: Record<string, string | number | boolean | undefined>) => {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) sp.append(k, String(v));
        }
        return sp.toString();
    };

    private signQS = (qs: string) => {
        return crypto.createHmac("sha256", this.API_SECRET).update(qs).digest("hex");
    };

    private headers = () => ({
        "X-MBX-APIKEY": this.API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
    });

    /* -------------------------------- Low-level REST helpers -------------------------------- */

    private signedGET = async <T>(path: string, params: Record<string, any>) => {
        await this.ensureFreshTime();
        const qsBase = this.buildQS({ ...params, timestamp: this.nowMs(), recvWindow: this.RECV_WINDOW });
        const sig = this.signQS(qsBase);
        const url = `${this.BASE_URL_API}${path}?${qsBase}&signature=${sig}`;
        return axios.get<T>(url, { headers: this.headers() });
    };

    private signedPOST = async <T>(path: string, params: Record<string, any>) => {
        await this.ensureFreshTime();
        const qsBase = this.buildQS({ ...params, timestamp: this.nowMs(), recvWindow: this.RECV_WINDOW });
        const sig = this.signQS(qsBase);
        const url = `${this.BASE_URL_API}${path}`;
        const body = `${qsBase}&signature=${sig}`;
        return axios.post<T>(url, body, { headers: this.headers() });
    };

    private signedDELETE = async <T>(path: string, params: Record<string, any>) => {
        await this.ensureFreshTime();
        const qsBase = this.buildQS({ ...params, timestamp: this.nowMs(), recvWindow: this.RECV_WINDOW });
        const sig = this.signQS(qsBase);
        const url = `${this.BASE_URL_API}${path}?${qsBase}&signature=${sig}`;
        return axios.delete<T>(url, { headers: this.headers() });
    };

    /* -------------------------------- REST APIs (Binance) -------------------------------- */

    private API_getOrderDetail = async (orderId: string, symbol: string) => {
        try {
            const res = await this.signedGET<any>("/fapi/v1/order", { symbol, orderId });
            // This endpoint doesn't return avg fill price. Use /allOrders to fetch avgPrice reliably.
            const detailsList = await this.signedGET<any[]>("/fapi/v1/allOrders", { symbol, orderId: orderId });
            const detail = Array.isArray(detailsList.data) ? detailsList.data.find((o: any) => String(o.orderId) === String(orderId)) : null;

            if (!detail) return null;
            return detail; // contains status, side, avgPrice, executedQty, updateTime, etc.
        } catch (err) {
            handleError(`Can't getOrderDetail`, "error", [err]);
            return null;
        }
    };

    private API_changePositionMode = async () => {
        try {
            // Ensure one-way mode (NOT dual / hedge)
            await this.signedPOST("/fapi/v1/positionSide/dual", { dualSidePosition: "false" });
        } catch (err) {
            handleError("Error change position mode", "error", [err]);
        }
    };

    API_cancelStoploss = async (value: __payloadCancelStoplossType) => {
        try {
            return await this.signedDELETE("/fapi/v1/batchOrders", { symbol: value.symbol, orderIdList: value.orderIds });
        } catch (err) {
            writeLog(["Error cancel stoploss", value.orderIds, err]);
        }
    };

    API_closeOrder = async (p: __payloadCancelOrderType) => {
        try {
            const side = p.side; // BUY to close short, SELL to close long
            const qty = p.qty.toString();

            const post = await this.signedPOST<any>("/fapi/v1/order", {
                symbol: p.symbol,
                side,
                type: "MARKET",
                quantity: qty,
                reduceOnly: "true",
                newClientOrderId: `${this.CLOSE_ORDER_CID_PREFIX}${Date.now()}`,
            });

            if (post.status !== 200) {
                writeLog(["Error cancel root order", `Body: ${JSON.stringify({ symbol: p.symbol, side, qty })}`]);
                return { success: false, markPrice: null };
            }

            const orderId = String(post.data.orderId);
            // Poll for full details (avgPrice)
            let filledOrder: any = null;
            for (let i = 0; i < 6 && !filledOrder; i++) {
                await new Promise((res) => setTimeout(res, 1500));
                filledOrder = await this.API_getOrderDetail(orderId, p.symbol);
            }

            const price = filledOrder ? parseFloat(filledOrder.avgPrice || "0") : null;
            return { success: true, markPrice: price };
        } catch (err) {
            handleError("API_closeOrder error", "error", [err]);
            return { success: false, markPrice: null };
        }
    };

    API_newOrder = async (p: __payloadOpenOrderType) => {
        try {
            await this.API_changePositionMode();

            const sym = p.symbol;
            const qty = p.qty.toString();
            const side = p.side; // "BUY" | "SELL"

            const r = await this.signedPOST<any>("/fapi/v1/order", {
                symbol: sym,
                side,
                type: "MARKET",
                quantity: qty,
                newClientOrderId: `${this.OPEN_ORDER_CID_PREFIX}${Date.now()}`,
            });

            const orderId = r.data?.orderId;
            const hasOrderId = typeof orderId === "number" || (typeof orderId === "string" && orderId.length > 0);
            if (!hasOrderId) throw new Error("No orderId returned");

            // Confirm fills / details
            let filledOrder: any = null;
            for (let i = 0; i < 6 && !filledOrder; i++) {
                await new Promise((res) => setTimeout(res, 1500));
                filledOrder = await this.API_getOrderDetail(String(orderId), sym);
            }

            if (!filledOrder || filledOrder.status !== "FILLED") {
                writeLog([`Order id ${orderId} not fully filled yet. Attempting to close.`]);
                await this.API_closeOrder({
                    symbol: sym,
                    side: side === "BUY" ? "SELL" : "BUY",
                    qty: p.qty,
                });
                return { success: false };
            }

            return {
                success: true,
                orderId: String(orderId),
                entryPrice: parseFloat(filledOrder.avgPrice || filledOrder.price || "0"),
                qty: parseFloat(filledOrder.executedQty || filledOrder.origQty || "0"),
                side: String(filledOrder.side || side).toUpperCase() as "BUY" | "SELL",
                timestamp: String(filledOrder.updateTime || this.nowMs()),
            };
        } catch (err) {
            writeLog(["Error new root order", ``, err]);
            return { success: false };
        }
    };

    API_adjustLeverage = async (symbol: string, leverange: number) => {
        try {
            const res = await this.signedPOST("/fapi/v1/leverage", { symbol, leverage: leverange });
            if (res.status !== 200) throw new Error();
        } catch (err) {
            handleError(`Can't adjust leverage ${symbol}`, "error", [err]);
        }
    };

    API_newStoploss = async (p: __payloadNewStoplossType) => {
        try {
            const sym = p.symbol;
            const stopSide = p.side === "SELL" ? "BUY" : "SELL"; // close opposite side

            const res = await this.signedPOST<any>("/fapi/v1/order", {
                symbol: sym,
                side: stopSide,
                type: "STOP_MARKET",
                stopPrice: p.stopPrice.toString(),
                workingType: "MARK_PRICE",
                reduceOnly: "true",
                quantity: p.qty.toString(),
            });

            if (res.status !== 200) {
                writeLog(["Error new stoploss", `Body: ${JSON.stringify({ sym, stopPrice: p.stopPrice, qty: p.qty })}`]);
                return { success: false, orderId: null };
            }

            return { success: true, orderId: String(res.data.orderId) };
        } catch (err) {
            handleError("API_newStoploss error", "error", [err]);
            return { success: false, orderId: null };
        }
    };

    API_getRecentFilledOrder = async (symbol: string, side: "BUY" | "SELL"): Promise<{ orderId: string | null }> => {
        try {
            const res = await this.signedGET<any[]>("/fapi/v1/userTrades", { symbol, limit: 10 });
            const trades = res.data || [];
            // Infer side from 'buyer' flag: buyer=true => BUY, buyer=false => SELL
            const wantBuyer = side === "BUY";
            const t = trades.find((x: any) => x.buyer === wantBuyer);
            return { orderId: t ? String(t.orderId) : null };
        } catch (err) {
            writeLog(["Exception API_getRecentFilledOrder", `Symbol: ${symbol}`, err]);
            return { orderId: null };
        }
    };

    API_checkHasOpenPosition = async (symbol: string) => {
        try {
            const res = await this.signedGET<any[]>("/fapi/v2/positionRisk", { symbol });
            const rows = res.data || [];
            // one-way mode → single row with positionAmt
            const row = rows[0];
            if (!row) return false;
            return Math.abs(parseFloat(row.positionAmt)) > 0;
        } catch (err) {
            writeLog(["Error API_checkHasOpenPosition", `Symbol: ${symbol}`, err]);
            return false;
        }
    };

    API_getFutureWalletBalance = async () => {
        try {
            const res = await this.signedGET<any[]>("/fapi/v2/balance", {});
            const usdt = (res.data || []).find((acc: any) => acc.asset === "USDT");
            return Number(usdt?.availableBalance ?? 0);
        } catch (err) {
            writeLog(["Error API_getFutureWalletBalance", err]);
            return 0;
        }
    };

    API_verifyOrder = async (
        symbol: string,
        orderId: string
    ): Promise<{
        entryPrice?: number;
        qty?: number;
        side?: "BUY" | "SELL";
        timestamp?: string;
        orderId?: string;
        success: boolean;
    }> => {
        const sym = symbol;
        const detail = await this.API_getOrderDetail(orderId, symbol);
        if (!detail) {
            return { success: false };
        }
        return {
            success: true,
            entryPrice: parseFloat(detail.avgPrice || detail.price || "0"),
            qty: parseFloat(detail.executedQty || detail.origQty || "0"),
            side: String(detail.side || "").toUpperCase() as "BUY" | "SELL",
            timestamp: String(detail.updateTime || this.nowMs()),
            orderId: String(detail.orderId),
        };
    };

    private API_getStoplossExecutedForSymbol = async (symbol: string) => {
        // There is no global “executed stoploss list” on Binance. We scan recent orders for each symbol.
        try {
            const startTime = Date.now() - 60 * 60 * 1000; // last 60 minutes window
            const res = await this.signedGET<any[]>("/fapi/v1/allOrders", { symbol, startTime, limit: 1000 });
            const executedStops = (res.data || []).filter((o: any) => o.status === "FILLED" && (o.type === "STOP_MARKET" || o.type === "TAKE_PROFIT_MARKET"));
            return executedStops;
        } catch (err) {
            writeLog(["Failed to API_getStoplossExecutedForSymbol", symbol, err]);
            return [];
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

    /* -------------------------------- User Data Stream (WS) -------------------------------- */

    private API_socketEventDriven = async () => {
        const connect = async () => {
            try {
                // 1) Create/refresh listenKey
                if (!this.listenKey) {
                    const r = await axios.post(`${this.BASE_URL_API}/fapi/v1/listenKey`, null, {
                        headers: { "X-MBX-APIKEY": this.API_KEY },
                    });
                    this.listenKey = r.data?.listenKey;

                    // Keepalive every ~55 min (must be < 60m)
                    if (this.listenKeyKeepAlive) clearInterval(this.listenKeyKeepAlive);
                    this.listenKeyKeepAlive = setInterval(async () => {
                        try {
                            await axios.put(`${this.BASE_URL_API}/fapi/v1/listenKey`, null, {
                                headers: { "X-MBX-APIKEY": this.API_KEY },
                            });
                        } catch (e) {
                            writeLog(["listenKey keepalive failed", e]);
                        }
                    }, 55 * 60 * 1000);
                }

                // 2) Open WS
                const url = `${this.BASE_URL_WS}/${this.listenKey}`;
                const socket = new WebSocket(url);
                this.ws = socket;

                const attemptReconnect = async () => {
                    try {
                        socket.close();
                    } catch {}
                    // drop current listenKey and get a fresh one on reconnect
                    this.listenKey = null;
                    setTimeout(() => this.API_socketEventDriven(), 3000);
                };

                socket.on("open", () => {
                    // no auth message needed
                });

                socket.on("message", async (msg: WebSocket.RawData) => {
                    try {
                        // Your expected payload shape: { data: { e, o, ... } }
                        const parsed = jsonbig.parse(msg.toString());
                        const { e, o } = (parsed?.data ?? parsed) as any; // fallback if broker sends without .data

                        if (e !== "ORDER_TRADE_UPDATE") return;

                        /* ─── Stop-loss / Take-profit hit ───────────────────── */
                        if (
                            o.x === "TRADE" && // executionReport
                            o.X === "FILLED" && // filled 100%
                            o.R === true && // reduce-only
                            (o.ot === "STOP_MARKET" || o.ot === "TAKE_PROFIT_MARKET")
                        ) {
                            const orderId = jsonbig.stringify(o.i); // preserve full precision id
                            const markPrice = parseFloat(o.ap); // avg price
                            await excutedStoploss(orderId, markPrice);
                            return;
                        }

                        /* ─── Đóng tay trên Web UI ──────────────────────────── */
                        if (
                            o.x === "TRADE" &&
                            o.X === "FILLED" &&
                            o.R === true &&
                            o.ot === "MARKET" && // pure market close
                            o.c?.includes("web") // clientOrderId from Web
                        ) {
                            const token = removeUSDT(o.s);
                            const markPrice = parseFloat(o.ap);
                            await closeOrderManually(token, markPrice, 0);
                            return;
                        }

                        // optional: handle listenKey expiration notice
                        if (e === "listenKeyExpired") {
                            writeLog(["listenKeyExpired notice → reconnect"]);
                            attemptReconnect();
                        }
                    } catch (err) {
                        writeLog(["WS message parse error", err]);
                    }
                });

                socket.on("error", (err) => {
                    writeLog(["WS error", err]);
                    attemptReconnect();
                });

                socket.on("close", () => {
                    attemptReconnect();
                });
            } catch (e) {
                writeLog(["WS connect error", e]);
                setTimeout(() => connect(), 3000);
            }

            void connect();
        };
    };

    private updateTimestamp = async () => {
        try {
            const r = await axios.get(`${this.BASE_URL_API}/fapi/v1/time`);
            const serverMs = Number(r.data?.serverTime);
            if (!Number.isFinite(serverMs)) throw new Error("Bad serverTime");
            this.timeOffsetMs = serverMs - Date.now();
            this.lastTimeSync = Date.now();
        } catch (e) {
            handleError("Can't update timestamp", "error", [e]);
        }
    };

    /*-------------------------------------------------------------------------------------------------------------*
     * Hàm này sẽ chạy song song cùng với Event driven web socket.
     * Phòng trường hợp stoploss hit trong khi socket connect disconect
     * Hàm sẽ gửi GET để lấy các stoploss đã executed mỗi 2 lần/phút rồi so sánh với stoploss của các open order
     *-------------------------------------------------------------------------------------------------------------*/
    private stoplossPoll = async () => {
        const POLL_INTERVAL_MS = 30_000;
        const checkedIds = new Set<string>();
        const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

        const loop = async (): Promise<void> => {
            const store = targetStorageInstance.getAll();
            const symbols = Object.keys(store); // project-specific: keys are your token identifiers

            try {
                for (const token of symbols) {
                    const executed = await this.API_getStoplossExecutedForSymbol(token + "USDT");
                    for (const o of executed) {
                        const slId = String(o.orderId);
                        if (checkedIds.has(slId)) continue;
                        checkedIds.add(slId);

                        // Only treat real stop/TP-market
                        if (o.type !== "STOP_MARKET" && o.type !== "TAKE_PROFIT_MARKET") continue;

                        // match against our cached open orders (by stored stoplossId if you track it)
                        const targetStorage = targetStorageInstance.getAll();
                        for (const tk in targetStorage) {
                            const openOrders = Object.values(targetStorage[tk]);
                            const matched = openOrders.find((ord: any) => String(ord.stoplossId) === slId);
                            if (matched) {
                                const markPrice = parseFloat(o.avgPrice || o.price || "0");
                                await excutedStoploss(slId, markPrice);
                                break;
                            }
                        }
                        if (checkedIds.size > 1000) checkedIds.clear();
                    }
                }
            } catch (e) {
                writeLog(["error", "stoplossPoll failed", e]);
            } finally {
                await sleep(POLL_INTERVAL_MS);
                return loop();
            }
        };

        void loop();
    };

    getTakerFee = () => {
        return this.TAKER_FEE;
    };

    getMakerFee = () => {
        return this.MAKER_FEE;
    };

    getPrice = async (symbol: string) => {
        const response = await axios.get(`${this.BASE_URL_API}/fapi/v1/premiumIndex?symbol=${symbol}`);

        if (response.status !== 200) {
            writeLog([`Error get price ${symbol}`, response]);
            return undefined;
        }
        return parseFloat(response.data.markPrice);
    };
}

export default Binance;
