import { getListenKey as APIGetListenKey, pingKeepAliveListenKey } from "@src/api/binance";
import { logging, writeLog } from "@src/utils/log";
import { AxiosResponse } from "axios";

let listenKey: string | undefined;

class ListenKey {
    constructor() {}

    async getListenKey() {
        let attempts = 0;
        while (attempts < 3 && !listenKey) {
            const response = await APIGetListenKey();
            if (response.status === 200) {
                listenKey = response.data.listenKey;
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
        if (attempts >= 3 && !listenKey) {
            logging("error", `Can't get listen key after 4 times, problem could be VPN please check again...`);
            process.exit();
        }
        return listenKey;
    }

    async updateListenKey() {
        var response: AxiosResponse = await pingKeepAliveListenKey(listenKey, true);
        while (response.status !== 200) {
            logging("warning", `Can't update listen key, trying again ...`);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 second before retrying
            response = await pingKeepAliveListenKey(listenKey, true);
        }
        listenKey = response.data.listenKey;
    }
}

export default ListenKey;
