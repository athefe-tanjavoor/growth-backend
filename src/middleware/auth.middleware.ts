import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { ApiError } from '../utils/response.js';
import { TokenPayload } from '../services/auth.service.js';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw ApiError.unauthorized('Invalid authentication token');
    }

    // Verify session if sessionId is in token
    if (decoded.sessionId) {
      const session = await Session.findById(decoded.sessionId);
      if (!session || !session.isValid || session.expiresAt < new Date()) {
        throw ApiError.unauthorized('Session has been revoked or expired');
      }
      req.sessionId = session._id.toString();
    }

    // Load active user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or account is deactivated');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
}
