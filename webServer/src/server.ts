import app from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from '../prisma/database';
import { binanceWebSocketService } from './services/binanceWebSocket';

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
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    binanceWebSocketService.disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    binanceWebSocketService.disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
})();
