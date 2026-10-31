import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog, AuditActions } from '../utils/auditLogger';
import { calculateNextBillingDate } from '../utils/dateUtils';

export const subscriptionService = {
  async list(opts: { page: number; limit: number; status?: string; customerId?: string; planId?: string }) {
    const { page, limit, status, customerId, planId } = opts;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (planId) where.planId = planId;

    const [total, data] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, company: true } },
          plan: { select: { id: true, name: true, billingInterval: true } },
          lines: {
            include: {
              product: { select: { id: true, name: true } },
              variant: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, grandTotal: true, dueDate: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!sub) throw createError('Subscription not found.', 404);
    return sub;
  },

  async pause(id: string, actorId: string, ipAddress?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
    if (!sub) throw createError('Subscription not found.', 404);
    if (sub.status !== 'ACTIVE') throw createError('Only ACTIVE subscriptions can be paused.', 400);
    if (!sub.plan.allowPause) throw createError('This plan does not allow pausing.', 400);

    await prisma.subscription.update({ where: { id }, data: { status: 'PAUSED' } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.SUBSCRIPTION_PAUSED,
      entityType: 'Subscription',
      entityId: id,
      ipAddress,
    });

    return { message: 'Subscription paused.' };
  },

  async resume(id: string, actorId: string, ipAddress?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
    if (!sub) throw createError('Subscription not found.', 404);
    if (sub.status !== 'PAUSED') throw createError('Only PAUSED subscriptions can be resumed.', 400);

    await prisma.subscription.update({ where: { id }, data: { status: 'ACTIVE' } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.SUBSCRIPTION_RESUMED,
      entityType: 'Subscription',
      entityId: id,
      ipAddress,
    });

    return { message: 'Subscription resumed.' };
  },

  async close(id: string, actorId: string, isAdmin: boolean, ipAddress?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
    if (!sub) throw createError('Subscription not found.', 404);
    if (sub.status !== 'ACTIVE' && sub.status !== 'PAUSED') {
      throw createError('Only ACTIVE or PAUSED subscriptions can be closed.', 400);
    }
    if (!sub.plan.allowEarlyClose && !isAdmin) {
      throw createError('This plan does not allow early closing. Contact an administrator.', 403);
    }

    await prisma.subscription.update({ where: { id }, data: { status: 'CLOSED', endDate: new Date() } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.SUBSCRIPTION_CLOSED,
      entityType: 'Subscription',
      entityId: id,
      ipAddress,
    });

    return { message: 'Subscription closed.' };
  },

  async renew(id: string, actorId: string, ipAddress?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
    if (!sub) throw createError('Subscription not found.', 404);
    if (sub.status !== 'CLOSED') throw createError('Only CLOSED subscriptions can be renewed.', 400);
    if (!sub.plan.allowRenewal) throw createError('This plan does not allow renewal.', 400);

    const today = new Date();
    const nextBillingDate = calculateNextBillingDate(today, sub.plan.billingInterval as any);

    await prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startDate: today,
        endDate: null,
        nextBillingDate,
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.SUBSCRIPTION_RENEWED,
      entityType: 'Subscription',
      entityId: id,
      changeDetails: { newStartDate: today, nextBillingDate } as Record<string, unknown>,
      ipAddress,
    });

    return { message: 'Subscription renewed successfully.' };
  },
};
