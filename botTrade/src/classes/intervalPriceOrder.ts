import { getPrice } from "@src/api/binance";
import { logging, writeLog } from "@src/utils/log";
import { checkTarget } from "@src/handleOrders/handleTarget";

let intervalArr: {
    [symbol: string]: any;
} = {};

class IntervalPriceOrder {
    constructor() {}
    getInterval(symbol: string) {
        return intervalArr[symbol];
    }
    removeInterval(symbol: string) {
        delete intervalArr[symbol];
    }
    getAllInterval() {
        return intervalArr;
    }

    createIntervalPriceCheck = (symbol: string, tokenId: number) => {
        const intervalId = setInterval(async () => {
            let response = await getPrice(`${symbol}`);
            if (response.status === 200) {
                await checkTarget(tokenId, response.data.markPrice);
            } else {
                let warning = `Can't check price for token ${symbol}`;
                writeLog([warning, response]);
                logging("warning", warning);
            }
        }, 3000);

        intervalArr[symbol] = intervalId;
    };
}

export default IntervalPriceOrder;
