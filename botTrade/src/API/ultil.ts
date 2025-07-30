import axios from "axios";
import { logging } from "../utils/log";

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
    try {
        const res = await axios.post(
            process.env.AWS_LAMBDA || "",
            { token }, // Send as an object (no need to stringify manually)
            {
                headers: {
                    "Content-Type": "application/json", // Important: Set correct header
                },
            }
        );
        return res.data;
    } catch (error: any) {
        console.error("Error in mutationUpdateData:", error.response ? error.response.data : error.message);
        throw error;
    }
};

export const getData1YearCandle = async (token: string, year: number | string) => {
    return await axios.get(`${process.env.GOOGLE_APP_SCRIPT}?action=readYear&token=${token}&year=${year}`);
};
