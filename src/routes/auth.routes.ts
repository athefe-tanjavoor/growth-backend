import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { loginSchema, changePasswordSchema } from '../validators/index.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

// MFA endpoints
router.post('/mfa/setup', authenticate, AuthController.setupMfa);
router.post('/mfa/verify', authenticate, AuthController.verifyMfa);
router.post('/mfa/disable', authenticate, AuthController.disableMfa);

export default router;
