import { createApp } from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { seedDatabase } from './jobs/seed.js';

async function bootstrap() {
  try {
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Growthanalys Backend v2.0 running on port ${config.port}`);
      logger.info(`🌐 Environment: ${config.env}`);
      logger.info(`📡 API Endpoint: http://localhost:${config.port}/api/v1`);
      logger.info(`🩺 Health Check: http://localhost:${config.port}/api/v1/health`);
    });

    // Graceful Shutdown
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Connect to MongoDB Atlas
    if (!config.mongodb.uri) {
      logger.warn('⚠️ MONGODB_URI environment variable is missing or empty! Database operations will fail until configured.');
    } else {
      try {
        await connectDB();
        await seedDatabase();
      } catch (dbError: any) {
        logger.error(`❌ Initial MongoDB Connection Failed: ${dbError.message}`);
        logger.warn('⚠️ Server remains running to serve health checks and allow environment updates.');
      }
    }
  } catch (error: any) {
    logger.error(`Fatal Startup Error: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
