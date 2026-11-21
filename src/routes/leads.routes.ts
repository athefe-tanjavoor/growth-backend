import { Router } from 'express';
import { LeadsController } from '../controllers/leads.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { leadLimiter } from '../middleware/rateLimit.middleware.js';
import { leadCreateSchema, leadUpdateSchema } from '../validators/index.js';
import { Permission } from '../constants/roles.js';

const router = Router();

// Public: Contact form submission
router.post('/', leadLimiter, validate(leadCreateSchema), LeadsController.createLead);

// Admin: Lead management
router.get('/', authenticate, requirePermission(Permission.LEADS_VIEW), LeadsController.getLeads);
router.get('/export/csv', authenticate, requirePermission(Permission.LEADS_EXPORT), LeadsController.exportLeadsCsv);
router.get('/:id', authenticate, requirePermission(Permission.LEADS_VIEW), LeadsController.getLeadById);
router.patch('/:id', authenticate, requirePermission(Permission.LEADS_EDIT), validate(leadUpdateSchema), LeadsController.updateLead);
router.delete('/:id', authenticate, requirePermission(Permission.LEADS_DELETE), LeadsController.deleteLead);

export default router;
