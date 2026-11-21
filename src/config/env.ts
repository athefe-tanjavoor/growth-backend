import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_growthanalys_2026_key_at_least_32_chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_growthanalys_2026_key_at_least_32_chars',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret_growthanalys',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/growthanalys_admin',
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
    bucketName: process.env.R2_BUCKET_NAME || 'growthanalys-media',
    publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''),
    endpoint: process.env.R2_ENDPOINT || '',
  },

  seed: {
    adminName: process.env.ADMIN_INITIAL_NAME || 'Muhil',
    adminEmail: process.env.ADMIN_INITIAL_EMAIL || 'admin@growthanalys.com',
    adminPassword: process.env.ADMIN_INITIAL_PASSWORD || 'Vetri nichayam',
  }
};
