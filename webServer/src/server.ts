import app from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new SocketIOServer(server);

io.on('connection', () => {});

server.listen(PORT, () => {});
