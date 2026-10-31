import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  customerId?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

export const TOKEN_COOKIE_NAME = 'sms_token';

