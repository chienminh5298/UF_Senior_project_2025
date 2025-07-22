import chalk from "chalk";
import path from "path";
import fs from "fs";

import { getTimeHour, getTimeMinute, getTimeSecond } from "@src/utils";
import { getPublicIP } from "@src/api/ultil";

export const logging = (type: string, mess: string) => {
    const date = new Date().toISOString();

    switch (type) {
        case "info":
            console.log(chalk.green(`[INFO] - ${date}: ${mess} \u2713`));
            break;
        case "warning":
            console.log(chalk.yellow(`[WARNING] - ${date}: ${mess}`));
            break;
        case "error":
            console.log(chalk.red(`[ERROR] - ${date}: ${mess} \u274c`));
            break;
    }
};

export const writeLog = async (data: any[]) => {
    const logFileName = `log_${getDate()}.txt`;
    const logFolderPath = path.join(process.cwd(), "log");
    const logFilePath = path.join(logFolderPath, logFileName);
    const time = `${getTimeHour()}:${getTimeMinute()}:${getTimeSecond()}`;

    isFolderExists(logFolderPath);
    isFileExists(logFilePath);

    // Get public ip address
    const IP = await getPublicIP();

    // Write file
    fs.appendFileSync(logFilePath, `\n\n ${time}`, "utf-8");
    for (let str of data) {
        fs.appendFileSync(logFilePath, `\n [${IP}] ${JSON.stringify(str)} \n`, "utf-8");
    }
    fs.appendFileSync(logFilePath, "\n\n \u274c--------------------------------\u274c", "utf-8");
};

const isFolderExists = (path: string) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
};

const isFileExists = (path: string) => {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, ""); // If file not exist, create
    }
};

const getDate = () => {
    const date = new Date();

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};
