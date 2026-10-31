import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog, AuditActions } from '../utils/auditLogger';

interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  userId?: string;
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export const customerService = {
  async list(opts: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = opts;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true, isActive: true } },
        },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(input: CreateCustomerInput, actorId: string, ipAddress?: string) {
    const customer = await prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone,
        company: input.company,
        address: input.address,
        ...(input.userId && { userId: input.userId }),
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.CUSTOMER_CREATED,
      entityType: 'Customer',
      entityId: customer.id,
      changeDetails: { name: input.name } as Record<string, unknown>,
      ipAddress,
    });

    return customer;
  },

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        subscriptions: {
          select: { id: true, subscriptionNumber: true, status: true, startDate: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!customer) throw createError('Customer not found.', 404);
    return customer;
  },

  async update(id: string, input: UpdateCustomerInput, actorId: string, ipAddress?: string) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw createError('Customer not found.', 404);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.company !== undefined && { company: input.company }),
        ...(input.address !== undefined && { address: input.address }),
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.CUSTOMER_UPDATED,
      entityType: 'Customer',
      entityId: id,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return customer;
  },

  async deactivate(id: string, actorId: string, ipAddress?: string) {
    const customer = await prisma.customer.findUnique({ where: { id }, include: { user: true } });
    if (!customer) throw createError('Customer not found.', 404);

    if (customer.user) {
      await prisma.user.update({ where: { id: customer.userId! }, data: { isActive: false } });
    }

    await createAuditLog({
      userId: actorId,
      action: AuditActions.CUSTOMER_DEACTIVATED,
      entityType: 'Customer',
      entityId: id,
      ipAddress,
    });

    return { message: 'Customer deactivated successfully.' };
  },
};
