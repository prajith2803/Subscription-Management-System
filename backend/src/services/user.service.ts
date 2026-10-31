import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog, AuditActions } from '../utils/auditLogger';

const BCRYPT_ROUNDS = 12;

interface CreateUserInput {
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  name?: string;
  phone?: string;
  company?: string;
}

interface UpdateUserInput {
  email?: string;
  role?: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  name?: string;
  phone?: string;
  company?: string;
  isActive?: boolean;
}

export const userService = {
  async list(opts: { page: number; limit: number; role?: string }) {
    const { page, limit, role } = opts;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true, company: true, phone: true } } },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          customer: true,
        },
      }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async create(input: CreateUserInput, actorId: string, ipAddress?: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw createError('A user with this email already exists.', 409);

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role || 'STAFF',
        },
      });

      // Create Customer profile if role is CUSTOMER (or always for non-staff)
      if (input.role === 'CUSTOMER' || input.name) {
        await tx.customer.create({
          data: {
            userId: newUser.id,
            name: input.name || input.email,
            phone: input.phone,
            company: input.company,
          },
        });
      }

      return newUser;
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.STAFF_CREATED,
      entityType: 'User',
      entityId: user.id,
      changeDetails: { email: input.email, role: input.role },
      ipAddress,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!user) throw createError('User not found.', 404);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      customer: user.customer,
    };
  },

  async update(id: string, input: UpdateUserInput, actorId: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({ where: { id }, include: { customer: true } });
    if (!user) throw createError('User not found.', 404);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          ...(input.email && { email: input.email }),
          ...(input.role && { role: input.role }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      if (user.customer && (input.name || input.phone || input.company)) {
        await tx.customer.update({
          where: { userId: id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.company !== undefined && { company: input.company }),
          },
        });
      }

      return updatedUser;
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.STAFF_UPDATED,
      entityType: 'User',
      entityId: id,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return this.getById(id);
  },

  async deactivate(id: string, actorId: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw createError('User not found.', 404);
    if (!user.isActive) throw createError('User is already deactivated.', 400);

    await prisma.user.update({ where: { id }, data: { isActive: false } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.STAFF_DEACTIVATED,
      entityType: 'User',
      entityId: id,
      ipAddress,
    });

    return { message: 'User deactivated successfully.' };
  },
};
