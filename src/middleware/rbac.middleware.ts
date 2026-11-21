import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/response.js';
import { Role, Permission, DEFAULT_ROLE_PERMISSIONS } from '../constants/roles.js';

export function requireRole(...allowedRoles: (Role | string)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    // Super Admin has unrestricted access
    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access restricted to roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    // Super Admin always bypasses
    if (req.user.role === Role.SUPER_ADMIN) {
      return next();
    }

    const userRole = req.user.role as Role;
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
    const customPermissions = (req.user.customPermissions || []) as Permission[];
    const allPermissions = new Set([...defaultPermissions, ...customPermissions]);

    const hasPermission = requiredPermissions.every((perm) => allPermissions.has(perm));

    if (!hasPermission) {
      return next(
        ApiError.forbidden(`Missing required permission: ${requiredPermissions.join(', ')}`)
      );
    }

    next();
  };
}
