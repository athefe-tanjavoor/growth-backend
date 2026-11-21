import { createApp } from './app.js';
import { connectDB } from './config/database.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { seedDatabase } from './jobs/seed.js';

async function bootstrap() {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Run safe idempotency check & seeder
    await seedDatabase();

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
  } catch (error: any) {
    logger.error(`Fatal Startup Error: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
