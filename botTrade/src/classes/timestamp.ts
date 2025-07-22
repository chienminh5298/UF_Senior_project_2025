import { getServerTime } from "@src/api/binance";
import { logging } from "@src/utils/log";
import { AxiosResponse } from "axios";

let timestamp: string | undefined;

class Timestamp {
    constructor() {}

    async getTimestamp() {
        let attempts = 0;
        while (attempts <= 3 && !timestamp) {
            const response: AxiosResponse = await getServerTime();
            if (response.status === 200) {
                timestamp = response.data.serverTime;
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
        if (attempts >= 3 && timestamp) {
            logging("error", `Can't get timestamp after 4 times, please check again.`);
            process.exit();
        }
        return timestamp;
    }

    async updateTimestamp() {
        var response: AxiosResponse = await getServerTime();
        while (response.status !== 200) {
            console.log(response);
            logging("warning", `Can't update timestamp, trying again ...`);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 second before retrying
            response = await getServerTime();
        }

        timestamp = response.data.serverTime;
    }
}

export default Timestamp;
