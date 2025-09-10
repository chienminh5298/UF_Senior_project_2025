import { BrokerInterface } from "@src/interface/broker";
import prisma from "@root/prisma/database";
import { logging } from "@src/utils/log";
import broker from "@src/API/broker";
import { handleError } from "../utils";

class BrokerInstancePool {
    private pool: Map<number, BrokerInterface>;

    constructor() {
        this.pool = new Map();
    }

    loadPool = async () => {
        try {
            const users = await prisma.user.findMany({
                where: { isActive: true, tradeBalance: { gt: 0 } },
                select: { id: true, apiKey: true, apiSecret: true, apiPassphrase: true },
            });

            const newPool = new Map<number, BrokerInterface>();
            newPool.set(0, new broker({ userId: 0, API_KEY: "", API_SECRET: "", API_PASSPHRASE: "", skipDecrypt: true })); // Dummy instance to use some function not need authorize (getPrice, ...)
            // if (process.env.isProduction) {
            //     for (const u of users) {
            //         const userBroker = new broker({ userId: u.id, API_KEY: u.apiKey || "", API_SECRET: u.apiSecret || "", API_PASSPHRASE: u.apiPassphrase });
            //         newPool.set(u.id, userBroker);
            //     }
            // }
            for (const u of users) {
                const userBroker = new broker({ userId: u.id, API_KEY: u.apiKey || "", API_SECRET: u.apiSecret || "", API_PASSPHRASE: u.apiPassphrase });
                newPool.set(u.id, userBroker);
            }
            this.pool = newPool; // automically replace when new data is ready
        } catch (err) {
            console.log(err);
            handleError("error", "[BrokerInstancePool] load failed:", [err]);
        }
    };

    refreshPool = () => {
        setInterval(async () => {
            await this.loadPool();
        }, 3_600_000); // Refresh every 1 hour
    };

    getBroker = (userId: number = 0) => {
        if (userId) {
            if (this.pool.has(userId)) {
                return this.pool.get(userId);
            } else {
                return undefined;
            }
        } else {
            return this.pool.get(0);
        }
    };

    getPool = () => {
        return this.pool;
    };
}

export default new BrokerInstancePool();
