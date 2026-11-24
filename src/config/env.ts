import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || '',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },

  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001', 'https://growthanalys.com', 'https://admin.growthanalys.com'],
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''),
    endpoint: process.env.R2_ENDPOINT || '',
  },

  seed: {
    adminName: process.env.ADMIN_INITIAL_NAME || '',
    adminEmail: process.env.ADMIN_INITIAL_EMAIL || '',
    adminPassword: process.env.ADMIN_INITIAL_PASSWORD || '',
  }
};
