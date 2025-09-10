// webServer/server.ts
import app from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from '../prisma/database';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new SocketIOServer(server);

io.on('connection', () => {
  console.log('User connected');
});

(async () => {
  await connectDatabase();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
