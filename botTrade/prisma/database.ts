import { PrismaClient } from "@prisma/client";

import { logging } from "@src/utils/log";

const prisma = new PrismaClient();

export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        logging("info", `Connect database successful.`);
    } catch (error) {
        logging("error", `Error connecting to the database: ${error}`);
    } finally {
        await prisma.$disconnect();
    }
};

export default prisma;
