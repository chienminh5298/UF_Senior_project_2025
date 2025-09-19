import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { json, urlencoded } from 'body-parser';

// Import routes
import routes from './routes/index';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();

app.use(cors());
app.use(json());

app.use(urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the server is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api', routes);

export default app;
