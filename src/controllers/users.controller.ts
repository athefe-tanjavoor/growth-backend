import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { Role } from '../constants/roles.js';
import { AuditService } from '../services/audit.service.js';
import { ApiResponse, ApiError } from '../utils/response.js';

export class UsersController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
      return ApiResponse.success(res, { users });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, customPermissions } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        throw ApiError.conflict('A user with that email already exists');
      }

      const user = new User({
        name,
        email,
        password,
        role: role || Role.ADMIN,
        customPermissions: customPermissions || [],
      });

      await user.save();

      await AuditService.log({
        req,
        action: 'USER_CREATED',
        module: 'USERS',
        resourceId: user._id.toString(),
        details: { name: user.name, email: user.email, role: user.role },
      });

      return ApiResponse.created(res, {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw ApiError.notFound('User not found');

      // Prevent non-superadmins from modifying superadmin accounts
      if (targetUser.role === Role.SUPER_ADMIN && req.user!.role !== Role.SUPER_ADMIN) {
        throw ApiError.forbidden('Only Super Admins can modify Super Admin accounts');
      }

      const updates = { ...req.body };
      delete updates.password; // Password changes must go through dedicated endpoint

      const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');

      await AuditService.log({
        req,
        action: 'USER_UPDATED',
        module: 'USERS',
        resourceId: targetUser._id.toString(),
        details: { updates },
      });

      return ApiResponse.success(res, { user: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) throw ApiError.notFound('User not found');

      // Protect against deleting yourself
      if (targetUser._id.toString() === req.user!._id.toString()) {
        throw ApiError.badRequest('You cannot delete your own account');
      }

      // Protect against deleting the last Super Admin
      if (targetUser.role === Role.SUPER_ADMIN) {
        const superAdminCount = await User.countDocuments({ role: Role.SUPER_ADMIN });
        if (superAdminCount <= 1) {
          throw ApiError.forbidden('Cannot delete the last Super Admin');
        }
      }

      await targetUser.deleteOne();

      await AuditService.log({
        req,
        action: 'USER_DELETED',
        module: 'USERS',
        resourceId: targetUser._id.toString(),
        details: { email: targetUser.email, role: targetUser.role },
      });

      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
