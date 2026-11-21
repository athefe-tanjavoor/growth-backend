import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  static async log(params: {
    req?: Request;
    action: string;
    module: string;
    resourceId?: string;
    details?: Record<string, any>;
    actorId?: any;
    actorEmail?: string;
    success?: boolean;
  }) {
    try {
      const { req, action, module, resourceId, details = {}, success = true } = params;

      // Filter out sensitive keys from details
      const sanitizedDetails = { ...details };
      const sensitiveKeys = ['password', 'token', 'refreshToken', 'secret', 'twoFactorSecret', 'creditCard'];
      for (const key of Object.keys(sanitizedDetails)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
          sanitizedDetails[key] = '[REDACTED]';
        }
      }

      const ipAddress = req ? (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '' : '';
      const userAgent = req ? req.headers['user-agent'] || '' : '';
      const actorId = params.actorId || req?.user?._id || null;
      const actorEmail = params.actorEmail || req?.user?.email || 'system';

      await AuditLog.create({
        actorId,
        actorEmail,
        action,
        module,
        resourceId,
        details: sanitizedDetails,
        ipAddress,
        userAgent,
        success,
      });
    } catch (err: any) {
      logger.error(`Failed to record audit log: ${err.message}`);
    }
  }

  static async logSecurityEvent(params: {
    req?: Request;
    type: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, any>;
  }) {
    try {
      const { req, type, severity = 'medium', details = {} } = params;
      const ipAddress = req ? (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '' : '';
      const userAgent = req ? req.headers['user-agent'] || '' : '';

      await SecurityEvent.create({
        type,
        severity,
        details,
        ipAddress,
        userAgent,
      });

      logger.warn(`🚨 Security Event [${severity.toUpperCase()}]: ${type} from ${ipAddress}`);
    } catch (err: any) {
      logger.error(`Failed to record security event: ${err.message}`);
    }
  }
}
