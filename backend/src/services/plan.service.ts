import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog, AuditActions } from '../utils/auditLogger';

interface CreatePlanInput {
  name: string;
  description?: string;
  billingInterval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  allowPause?: boolean;
  allowEarlyClose?: boolean;
  allowRenewal?: boolean;
  isActive?: boolean;
  trialDays?: number;
}

interface UpdatePlanInput {
  name?: string;
  description?: string;
  billingInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  allowPause?: boolean;
  allowEarlyClose?: boolean;
  allowRenewal?: boolean;
  isActive?: boolean;
  trialDays?: number;
}

export const planService = {
  async list(opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.plan.count(),
      prisma.plan.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          planProducts: {
            include: {
              product: { select: { id: true, name: true, salesPrice: true } },
              variant: { select: { id: true, name: true, additionalPrice: true } },
            },
          },
        },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(input: CreatePlanInput, actorId: string, ipAddress?: string) {
    const plan = await prisma.plan.create({
      data: {
        name: input.name,
        description: input.description,
        billingInterval: input.billingInterval,
        allowPause: input.allowPause ?? false,
        allowEarlyClose: input.allowEarlyClose ?? false,
        allowRenewal: input.allowRenewal ?? true,
        isActive: input.isActive ?? true,
        trialDays: input.trialDays ?? 0,
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.PLAN_CREATED,
      entityType: 'Plan',
      entityId: plan.id,
      changeDetails: { name: input.name } as Record<string, unknown>,
      ipAddress,
    });

    return plan;
  },

  async getById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        planProducts: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    if (!plan) throw createError('Plan not found.', 404);
    return plan;
  },

  async update(id: string, input: UpdatePlanInput, actorId: string, ipAddress?: string) {
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) throw createError('Plan not found.', 404);

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.billingInterval && { billingInterval: input.billingInterval }),
        ...(input.allowPause !== undefined && { allowPause: input.allowPause }),
        ...(input.allowEarlyClose !== undefined && { allowEarlyClose: input.allowEarlyClose }),
        ...(input.allowRenewal !== undefined && { allowRenewal: input.allowRenewal }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.trialDays !== undefined && { trialDays: input.trialDays }),
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.PLAN_UPDATED,
      entityType: 'Plan',
      entityId: id,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return plan;
  },

  async addProduct(planId: string, input: { productId: string; variantId?: string; quantity?: number }, actorId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw createError('Plan not found.', 404);

    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw createError('Product not found.', 404);

    const planProduct = await prisma.planProduct.create({
      data: {
        planId,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity ?? 1,
      },
      include: {
        product: { select: { id: true, name: true, salesPrice: true } },
        variant: { select: { id: true, name: true, additionalPrice: true } },
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.PLAN_UPDATED,
      entityType: 'Plan',
      entityId: planId,
      changeDetails: { addedProduct: input.productId } as Record<string, unknown>,
    });

    return planProduct;
  },

  async removeProduct(planId: string, planProductId: string, actorId: string) {
    const planProduct = await prisma.planProduct.findFirst({ where: { id: planProductId, planId } });
    if (!planProduct) throw createError('Plan product not found.', 404);

    await prisma.planProduct.delete({ where: { id: planProductId } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.PLAN_UPDATED,
      entityType: 'Plan',
      entityId: planId,
      changeDetails: { removedPlanProduct: planProductId } as Record<string, unknown>,
    });

    return { message: 'Product removed from plan.' };
  },
};
