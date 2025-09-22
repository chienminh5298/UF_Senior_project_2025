import axios from "axios";
import { logging } from "../utils/log";
import { sendTelegramAdminMessage } from "../utils/telegram";

export const getPublicIP = async () => {
    try {
        const response = await axios.get("https://api.ipify.org?format=json");
        return response.data.ip;
    } catch {
        logging("error", "Failed to fetch public IP");
        return null;
    }
};

// POST to AWS lamda to update data
export const mutationUpdateData = async (token: string) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await axios.post(
                process.env.AWS_LAMBDA || "",
                { token },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            return res.data;
        } catch (error: any) {
            const msg = error.response ? error.response.data : error.message;
            console.error(`Attempt ${attempt} failed:`, msg);

            if (attempt === 3) {
                // no more retries
                await sendTelegramAdminMessage(`⚠️ *Error when update data to google sheet*`);
                return;
            }

            // wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // exponential backoff
        }
    }
};

export const getData1YearCandle = async (token: string, year: number | string) => {
    return await axios.get(`${process.env.GOOGLE_APP_SCRIPT}?action=readYear&token=${token}&year=${year}`);
};
