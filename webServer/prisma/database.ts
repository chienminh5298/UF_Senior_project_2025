import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const connectDatabase = async () => {
    try {
        await prisma.$connect();
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
};

export default prisma;