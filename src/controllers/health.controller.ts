import { Request, Response } from 'express';
import mongoose from 'mongoose';

export class HealthController {
  static getHealth(req: Request, res: Response) {
    return res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'growthanalys-backend',
      version: '2.0.0',
    });
  }

  static async getReady(req: Request, res: Response) {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!isDbConnected) {
      return res.status(503).json({
        status: 'unready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }
}
