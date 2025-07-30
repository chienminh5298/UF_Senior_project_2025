import { BrokerConstructor } from "../interface/broker";
import Binance from "./binance";

type BrokerInit = {
    userId: number;
    API_KEY: string;
    API_SECRET: string;
    API_PASSPHRASE: string | null;
    skipDecrypt?: boolean;
};

const broker: BrokerConstructor<BrokerInit> = Binance;

export default broker;
