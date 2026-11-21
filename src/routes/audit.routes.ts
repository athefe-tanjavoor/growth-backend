import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { Permission } from '../constants/roles.js';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.ACTIVITY_LOGS_VIEW), AuditController.listAuditLogs);
router.get('/security', authenticate, requirePermission(Permission.SECURITY_MANAGE), AuditController.listSecurityEvents);
router.get('/export/csv', authenticate, requirePermission(Permission.ACTIVITY_LOGS_EXPORT), AuditController.exportAuditLogsCsv);

export default router;
