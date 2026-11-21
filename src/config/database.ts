import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { config } from './env.js';

export async function connectDB(): Promise<typeof mongoose> {
  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is required in environment variables');
  }

  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: config.env !== 'production',
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host} [Database: ${conn.connection.name}]`);
    return conn;
  } catch (error: any) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
}
