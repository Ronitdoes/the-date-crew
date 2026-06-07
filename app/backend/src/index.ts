import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
import path from 'path';
// Load root .env for local development. On Render, env vars are set via the
// dashboard and already present in process.env — dotenv.config() is a no-op
// when the file doesn't exist (it won't throw, just silently skips).
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: allow the Vercel frontend (and localhost for dev).
// Set ALLOWED_ORIGINS in Render dashboard as a comma-separated list, e.g.:
//   https://your-app.vercel.app,http://localhost:3000
const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy does not allow origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get(['/health', '/healthz'], (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Backend server is running on port ${PORT}`);
    logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

export { app };
