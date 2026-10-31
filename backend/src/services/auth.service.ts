import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { signToken, generateResetToken } from '../utils/tokenUtils';
import { createError } from '../middleware/errorHandler';
import { sendEmail } from '../config/mail';
import { createAuditLog, AuditActions } from '../utils/auditLogger';
import { env } from '../config/env';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export const authService = {

  async register(input: RegisterInput, ipAddress?: string) {
    // Check for existing email
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw createError('An account with this email already exists.', 409);

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Create user + customer profile atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: 'CUSTOMER',
        },
      });

      await tx.customer.create({
        data: {
          userId: newUser.id,
          name: input.name,
          phone: input.phone,
          company: input.company,
        },
      });

      return newUser;
    });

    await createAuditLog({
      userId: user.id,
      action: AuditActions.CUSTOMER_CREATED,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return { id: user.id, email: user.email, role: user.role };
  },

  async login(input: LoginInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { customer: true },
    });

    if (!user || !user.isActive) {
      throw createError('Invalid email or password.', 401);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw createError('Invalid email or password.', 401);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
    });

    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.customer?.name,
        customerId: user.customer?.id,
      },
    };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user || !user.isActive) return { message: 'If that email is registered, a reset link has been sent.' };

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    const rawToken = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: rawToken, expiresAt },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password/${rawToken}`;

    const result = await sendEmail({
      to: email,
      subject: 'Reset your Brightloop password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Password Reset Request</h2>
          <p>You requested a password reset for your Brightloop account.</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
            Reset Password
          </a>
          <p>Or copy this link: <code>${resetUrl}</code></p>
          <p>If you did not request this, please ignore this email.</p>
          <hr />
          <small>Brightloop Software – Subscription Management</small>
        </div>
      `,
    });

    return {
      message: 'If that email is registered, a reset link has been sent.',
      ...(env.isDev && result.previewUrl ? { devPreviewUrl: result.previewUrl } : {}),
    };
  },

  async resetPassword(token: string, newPassword: string, ipAddress?: string) {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) throw createError('Invalid or expired reset link.', 400);
    if (resetRecord.isUsed) throw createError('This reset link has already been used.', 400);
    if (resetRecord.expiresAt < new Date()) throw createError('This reset link has expired. Please request a new one.', 400);

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      });
    });

    await createAuditLog({
      userId: resetRecord.userId,
      action: AuditActions.PASSWORD_RESET_COMPLETED,
      entityType: 'User',
      entityId: resetRecord.userId,
      ipAddress,
    });

    return { message: 'Password reset successfully. You can now log in.' };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });
    if (!user) throw createError('User not found', 404);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      name: user.customer?.name,
      customerId: user.customer?.id,
      company: user.customer?.company,
      phone: user.customer?.phone,
    };
  },
};

