import { Router } from 'express';
import { BlogsController } from '../controllers/blogs.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { blogCreateSchema, blogUpdateSchema } from '../validators/index.js';
import { Permission } from '../constants/roles.js';

const router = Router();

// Public: Published blogs
router.get('/published', BlogsController.getPublishedBlogs);
router.get('/slug/:slug', BlogsController.getBlogBySlug);

// Admin: Blog CMS operations
router.get('/', authenticate, requirePermission(Permission.BLOGS_VIEW), BlogsController.getAdminBlogs);
router.get('/:id', authenticate, requirePermission(Permission.BLOGS_VIEW), BlogsController.getBlogById);
router.post('/', authenticate, requirePermission(Permission.BLOGS_CREATE), validate(blogCreateSchema), BlogsController.createBlog);
router.put('/:id', authenticate, requirePermission(Permission.BLOGS_EDIT), validate(blogUpdateSchema), BlogsController.updateBlog);
router.delete('/:id', authenticate, requirePermission(Permission.BLOGS_DELETE), BlogsController.deleteBlog);

export default router;
