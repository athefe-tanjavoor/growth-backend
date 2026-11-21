import { Router } from 'express';
import authRoutes from './auth.routes.js';
import leadsRoutes from './leads.routes.js';
import blogsRoutes from './blogs.routes.js';
import portfoliosRoutes from './portfolios.routes.js';
import mediaRoutes from './media.routes.js';
import analyticsRoutes from './analytics.routes.js';
import usersRoutes from './users.routes.js';
import auditRoutes from './audit.routes.js';
import packagesRoutes from './packages.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

// =============================================================================
// Standard API v1 Routes (/api/v1/*)
// =============================================================================
router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/blogs', blogsRoutes);
router.use('/portfolios', portfoliosRoutes);
router.use('/portfolio', portfoliosRoutes); // Alias
router.use('/media', mediaRoutes);
router.use('/uploads', mediaRoutes); // Alias
router.use('/analytics', analyticsRoutes);
router.use('/users', usersRoutes);
router.use('/audit', auditRoutes);
router.use('/packages', packagesRoutes);
router.use('/health', healthRoutes);

export default router;
