import WebSocket from "ws";
import jsonbig from "json-bigint";

import { closeOrderManually } from "@src/handleOrders/handleOrder";
import { excutedStoploss } from "@src/handleOrders/handleStoploss";
import ListenKey from "@src/classes/listenKey";
import { logging } from "@src/utils/log";
import { setting } from "@root/setting";
import { removeUSDT } from "@src/utils";

export const createOpenOrderSocket = async () => {
    let listenKey = await new ListenKey().getListenKey();

    const URI = `${setting.BINANCE.BASE_URL_WEB_SOCKET}?streams=${listenKey}`;
    var socket = new WebSocket(URI);

    const attempReconnect = () => {
        setTimeout(() => {
            createOpenOrderSocket();
        }, 3000);
    };

    socket.on("open", () => {
        logging("info", "Binance socket open successfuly.");
    });

    socket.on("message", async (msg: WebSocket.RawData) => {
        var data = jsonbig.parse(msg.toString()).data;

        if (data.e === "ORDER_TRADE_UPDATE") {
            if (data.o.x === "EXPIRED" && (data.o.o === "STOP_MARKET" || data.o.o === "TAKE_PROFIT_MARKET")) {
                // Reach stoploss or take profit
                let orderId = jsonbig.stringify(data.o.i); // [data.o.i] is orderId
                let markPrice = parseFloat(data.o.ap); // [data.o.ap] is average price
                await excutedStoploss(orderId, markPrice);
            } else if (data.o.o === "MARKET" && data.o.x === "TRADE" && data.o.X === "FILLED" && data.o.ot === "MARKET" && data.o.R === true && data.o.c.includes("web")) {
                // Close order manually (Close all orders belongs to this token)
                let token = removeUSDT(data.o.s);
                let markPrice = parseFloat(data.o.ap);
                await closeOrderManually(token, markPrice);
            }
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
