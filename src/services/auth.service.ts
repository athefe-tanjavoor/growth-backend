import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { config } from '../config/env.js';
import { IUser } from '../models/User.js';
import { Session } from '../models/Session.js';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
}

export class AuthService {
  static generateAccessToken(user: IUser, sessionId?: string): string {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async createSession(user: IUser, userAgent?: string, ipAddress?: string) {
    const rawRefreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash,
      userAgent: userAgent || '',
      ipAddress: ipAddress || '',
      isValid: true,
      expiresAt,
    });

    const accessToken = this.generateAccessToken(user, session._id.toString());

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId: session._id,
      expiresAt,
    };
  }

  static generateMfaSecret(email: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(email, 'Growthanalys', secret);
    return { secret, otpauth };
  }

  static async generateQrCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  static verifyMfaToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }

  static generateRecoveryCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
