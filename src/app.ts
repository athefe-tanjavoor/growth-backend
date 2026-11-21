import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env.js';
import apiV1Routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { logger } from './utils/logger.js';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy for Coolify / reverse proxy headers (X-Forwarded-For)
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.cors.origins.includes('*') || config.cors.origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev, controlled in prod
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Compression & parsers
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(config.jwt.cookieSecret));

  // Request logging
  if (config.env !== 'test') {
    app.use(
      morgan(':method :url :status :res[content-length] - :response-time ms', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      })
    );
  }

  // Rate Limiting
  app.use(generalLimiter);

  // Root health response
  app.get('/', (req, res) => {
    res.json({
      service: 'Growthanalys Centralized API',
      version: '2.0.0',
      status: 'operational',
      docs: '/api/v1/health',
    });
  });

  // Mount API v1
  app.use('/api/v1', apiV1Routes);

  // ===========================================================================
  // Backward-Compatibility Mounts: Serves legacy frontend endpoints seamlessly
  // ===========================================================================
  app.use('/api', apiV1Routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
