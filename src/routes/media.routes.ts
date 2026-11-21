import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { Permission } from '../constants/roles.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Upload image directly to Cloudflare R2
router.post(
  '/upload', 
  authenticate, 
  requirePermission(Permission.MEDIA_UPLOAD), 
  upload.single('image'), 
  MediaController.uploadImage
);

// Alternative endpoint matching legacy path /image
router.post(
  '/image',
  authenticate,
  requirePermission(Permission.MEDIA_UPLOAD),
  upload.single('image'),
  MediaController.uploadImage
);

// Presigned direct browser upload URL
router.post(
  '/presigned-url', 
  authenticate, 
  requirePermission(Permission.MEDIA_UPLOAD), 
  MediaController.getPresignedUploadUrl
);

// Media listing and deletion
router.get('/', authenticate, requirePermission(Permission.MEDIA_VIEW), MediaController.listMedia);
router.post('/record', authenticate, requirePermission(Permission.MEDIA_UPLOAD), MediaController.createMediaRecord);
router.delete('/', authenticate, requirePermission(Permission.MEDIA_DELETE), MediaController.deleteMedia);

export default router;
