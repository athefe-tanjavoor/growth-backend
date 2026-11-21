import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { ApiResponse } from '../utils/response.js';

export class AuditController {
  static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { module, action, search, page = '1', limit = '50' } = req.query;
      const query: any = {};

      if (module && module !== 'all') query.module = module;
      if (action) query.action = action;
      if (search) {
        query.$or = [
          { actorEmail: { $regex: search as string, $options: 'i' } },
          { action: { $regex: search as string, $options: 'i' } },
        ];
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [logs, total] = await Promise.all([
        AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        AuditLog.countDocuments(query),
      ]);

      return ApiResponse.success(res, {
        logs,
        meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listSecurityEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await SecurityEvent.find().sort({ createdAt: -1 }).limit(100).lean();
      return ApiResponse.success(res, { events });
    } catch (error) {
      next(error);
    }
  }

  static async exportAuditLogsCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000).lean();

      const headers = ['Timestamp', 'Actor', 'Action', 'Module', 'ResourceID', 'IP', 'Success'];
      const rows = logs.map((l) => [
        l.createdAt.toISOString(),
        `"${l.actorEmail || 'anonymous'}"`,
        `"${l.action}"`,
        `"${l.module}"`,
        `"${l.resourceId || ''}"`,
        `"${l.ipAddress || ''}"`,
        l.success ? 'TRUE' : 'FALSE',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
