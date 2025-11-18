import { PrismaClient } from "@prisma/client";
import prismaClient from '../src/models/prismaClient';

export const connectDatabase = async () => {
    try {
        await prismaClient.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

// Graceful shutdown - disconnect on process termination
process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
});

export default prismaClient;