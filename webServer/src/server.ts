import app from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from '../prisma/database';
import { binanceWebSocketService } from './services/binanceWebSocket';
import prisma from './models/prismaClient';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new SocketIOServer(server);

io.on('connection', () => {
  console.log('User connected');
});

(async () => {
  await connectDatabase();

  // Start Binance WebSocket service for live price updates
  try {
    await binanceWebSocketService.connect();
    console.log('Binance WebSocket service started');
  } catch (error) {
    console.error('Failed to start Binance WebSocket service:', error);
  }

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    binanceWebSocketService.disconnect();
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})();
