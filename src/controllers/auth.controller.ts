import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { AuthService } from '../services/auth.service.js';
import { AuditService } from '../services/audit.service.js';
import { ApiResponse, ApiError } from '../utils/response.js';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, twoFactorCode } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        await AuditService.logSecurityEvent({
          req,
          type: 'LOGIN_FAILURE_UNKNOWN_USER',
          severity: 'medium',
          details: { email },
        });
        throw ApiError.unauthorized('Invalid email or password');
      }

      if (!user.isActive) {
        throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await AuditService.logSecurityEvent({
          req,
          type: 'LOGIN_FAILURE_BAD_PASSWORD',
          severity: 'medium',
          details: { email },
        });
        throw ApiError.unauthorized('Invalid email or password');
      }

      // If user has MFA enabled, verify code
      if (user.isTwoFactorEnabled) {
        if (!twoFactorCode) {
          return ApiResponse.success(res, { mfaRequired: true }, 'MFA code required', 200);
        }

        const isTotpValid = AuthService.verifyMfaToken(twoFactorCode, user.twoFactorSecret!);
        const isRecoveryValid = user.twoFactorRecoveryCodes?.includes(twoFactorCode.toUpperCase());

        if (!isTotpValid && !isRecoveryValid) {
          await AuditService.logSecurityEvent({
            req,
            type: 'MFA_FAILURE',
            severity: 'high',
            details: { email },
          });
          throw ApiError.unauthorized('Invalid MFA verification code');
        }

        // Consume recovery code if used
        if (isRecoveryValid) {
          user.twoFactorRecoveryCodes = user.twoFactorRecoveryCodes?.filter(
            (code: string) => code !== twoFactorCode.toUpperCase()
          );
          await user.save();
        }
      }

      // Record successful login & session
      user.lastLoginAt = new Date();
      user.lastLoginIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      await user.save();

      const userAgent = req.headers['user-agent'] || '';
      const session = await AuthService.createSession(user, userAgent, user.lastLoginIp);

      await AuditService.log({
        req,
        action: 'USER_LOGIN',
        module: 'AUTH',
        resourceId: user._id.toString(),
        actorId: user._id,
        actorEmail: user.email,
        details: { ip: user.lastLoginIp },
      });

      // Set HTTP-only secure cookie for refresh token
      res.cookie('refreshToken', session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        expires: session.expiresAt,
      });

      return ApiResponse.success(
        res,
        {
          token: session.accessToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
          },
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!rawRefreshToken) {
        throw ApiError.unauthorized('No refresh token provided');
      }

      const tokenHash = AuthService.hashToken(rawRefreshToken);
      const session = await Session.findOne({ refreshTokenHash: tokenHash });

      if (!session || !session.isValid || session.expiresAt < new Date()) {
        throw ApiError.unauthorized('Invalid or expired refresh token');
      }

      const user = await User.findById(session.userId);
      if (!user || !user.isActive) {
        throw ApiError.unauthorized('User not found or inactive');
      }

      // Rotate refresh token
      const newRefreshToken = AuthService.generateRefreshToken();
      session.refreshTokenHash = AuthService.hashToken(newRefreshToken);
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await session.save();

      const newAccessToken = AuthService.generateAccessToken(user, session._id.toString());

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        expires: session.expiresAt,
      });

      return ApiResponse.success(res, { token: newAccessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.sessionId) {
        await Session.findByIdAndUpdate(req.sessionId, { isValid: false });
      }

      res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

      await AuditService.log({
        req,
        action: 'USER_LOGOUT',
        module: 'AUTH',
        details: { sessionId: req.sessionId },
      });

      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!._id).select('-password');
      return ApiResponse.success(res, { user });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user!._id);
      if (!user) throw ApiError.notFound('User not found');

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw ApiError.badRequest('Current password is incorrect');
      }

      user.password = newPassword;
      await user.save();

      // Revoke all other active sessions for security
      await Session.updateMany({ userId: user._id, _id: { $ne: req.sessionId } }, { isValid: false });

      await AuditService.log({
        req,
        action: 'PASSWORD_CHANGED',
        module: 'AUTH',
        resourceId: user._id.toString(),
      });

      return ApiResponse.success(res, null, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setupMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!._id);
      if (!user) throw ApiError.notFound('User not found');

      const { secret, otpauth } = AuthService.generateMfaSecret(user.email);
      const qrCodeDataUrl = await AuthService.generateQrCode(otpauth);

      // Save secret temporarily (pending verification)
      user.twoFactorSecret = secret;
      await user.save();

      return ApiResponse.success(res, { secret, qrCode: qrCodeDataUrl }, 'MFA setup initiated');
    } catch (error) {
      next(error);
    }
  }

  static async verifyMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user!._id);
      if (!user || !user.twoFactorSecret) {
        throw ApiError.badRequest('MFA setup was not initiated');
      }

      const isValid = AuthService.verifyMfaToken(token, user.twoFactorSecret);
      if (!isValid) {
        throw ApiError.badRequest('Invalid verification code');
      }

      const recoveryCodes = AuthService.generateRecoveryCodes();
      user.isTwoFactorEnabled = true;
      user.twoFactorRecoveryCodes = recoveryCodes;
      await user.save();

      await AuditService.log({
        req,
        action: 'MFA_ENABLED',
        module: 'SECURITY',
        resourceId: user._id.toString(),
      });

      return ApiResponse.success(res, { recoveryCodes }, 'MFA enabled successfully');
    } catch (error) {
      next(error);
    }
  }

  static async disableMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      const user = await User.findById(req.user!._id);
      if (!user) throw ApiError.notFound();

      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw ApiError.unauthorized('Password is required to disable MFA');

      user.isTwoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.twoFactorRecoveryCodes = [];
      await user.save();

      await AuditService.log({
        req,
        action: 'MFA_DISABLED',
        module: 'SECURITY',
        resourceId: user._id.toString(),
      });

      return ApiResponse.success(res, null, 'MFA disabled');
    } catch (error) {
      next(error);
    }
  }
}
