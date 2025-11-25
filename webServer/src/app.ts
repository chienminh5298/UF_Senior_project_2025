import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { json, urlencoded } from 'body-parser';

// Import routes
import routes from './routes/index';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();

// CORS configuration - allow all origins in development/Docker
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Adjust port as needed
      'http://localhost:3001',
      'https://moneymachine.work',
      'https://admin.moneymachine.work',
      // Add more as needed
    ],
    credentials: true,
  })
);
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

// Error handling middleware - must be after routes
app.use((err: any, req: express.Request, res: express.Response) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
