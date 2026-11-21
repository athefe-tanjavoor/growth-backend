import { Router } from 'express';
import { UsersController } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission, requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { userCreateSchema, userUpdateSchema } from '../validators/index.js';
import { Permission, Role } from '../constants/roles.js';

const router = Router();

router.get('/', authenticate, requirePermission(Permission.USERS_MANAGE), UsersController.listUsers);
router.post('/', authenticate, requirePermission(Permission.USERS_MANAGE), validate(userCreateSchema), UsersController.createUser);
router.put('/:id', authenticate, requirePermission(Permission.USERS_MANAGE), validate(userUpdateSchema), UsersController.updateUser);
router.delete('/:id', authenticate, requireRole(Role.SUPER_ADMIN), UsersController.deleteUser);

export default router;
