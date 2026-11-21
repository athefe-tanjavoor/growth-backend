import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/overview', authenticate, AnalyticsController.getDashboardOverview);

export default router;
