import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { json, urlencoded } from 'body-parser';

// Import routes
import routes from './routes/index';

dotenv.config();

const app = express();

app.use(cors());
app.use(json());

app.use(urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api', routes);

export default app;
