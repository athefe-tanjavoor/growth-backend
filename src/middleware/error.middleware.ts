import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Resource';
    message = `${field} already exists with that value.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    errors = Object.values(err.errors).map((e: any) => e.message);
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}] - ${err.stack || message}`);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    timestamp: new Date().toISOString(),
  });
}
