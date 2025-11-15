import { checkTarget } from "@src/handleOrders/handleTarget";
import { logging } from "@src/utils/log";
import brokerInstancePool from "./brokerInstancePool";

let intervalArr: {
    [symbol: string]: any;
} = {};

class IntervalPriceOrder {
    getInterval(symbol: string) {
        return intervalArr[symbol];
    }
    removeInterval(symbol: string) {
        delete intervalArr[symbol];
    }
    getAllInterval() {
        return intervalArr;
    }

    createIntervalPriceCheck = (symbol: string, token: string) => {
        if (!intervalArr[symbol]) {
            const intervalId = setInterval(async () => {
                const broker = brokerInstancePool.getBroker(); // 0 is dummy instance
                let price = await broker!.getPrice(`${symbol}`);
                if (price) {
                    await checkTarget(token, price);
                } else {
                    let warning = `Can't check price for token ${symbol}`;
                    logging("warning", warning);
                }
            }, 5000);

            intervalArr[symbol] = intervalId;
        }
    };
}

const intervalPriceOrderInstance = new IntervalPriceOrder();
export default intervalPriceOrderInstance;
