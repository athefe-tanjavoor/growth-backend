import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolios.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { portfolioCreateSchema, portfolioUpdateSchema } from '../validators/index.js';
import { Permission } from '../constants/roles.js';

const router = Router();

// Public: Get published portfolios
router.get('/published', PortfolioController.getPublicPortfolios);

// Admin: CRUD
router.get('/', authenticate, requirePermission(Permission.PORTFOLIOS_VIEW), PortfolioController.getAdminPortfolios);
router.post('/', authenticate, requirePermission(Permission.PORTFOLIOS_MANAGE), validate(portfolioCreateSchema), PortfolioController.createPortfolio);
router.put('/:id', authenticate, requirePermission(Permission.PORTFOLIOS_MANAGE), validate(portfolioUpdateSchema), PortfolioController.updatePortfolio);
router.delete('/:id', authenticate, requirePermission(Permission.PORTFOLIOS_MANAGE), PortfolioController.deletePortfolio);

export default router;
