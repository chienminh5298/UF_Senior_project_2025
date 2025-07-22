type CandleType = {
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
};

type SystemSetting = {
    BINANCE: {
        BASE_URL_WEB_SOCKET: string;
        BASE_URL_API: string;
        TAKER_FEE: number;
    };
};
