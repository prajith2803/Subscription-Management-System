import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog, AuditActions } from '../utils/auditLogger';
import { generateQuotationNumber, generateSubscriptionNumber, calculateNextBillingDate } from '../utils/dateUtils';

interface QuotationLine {
  productId: string;
  variantId?: string;
  description?: string;
  quantity: number;
  unitPrice: number | string;
}

interface CreateQuotationInput {
  customerId: string;
  planId: string;
  templateId?: string;
  notes?: string;
  validUntil?: string;
  lines: QuotationLine[];
}

interface UpdateQuotationInput {
  notes?: string;
  validUntil?: string;
  lines?: QuotationLine[];
}

export const quotationService = {
  async list(opts: { page: number; limit: number; customerId?: string; status?: string }) {
    const { page, limit, customerId, status } = opts;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [total, data] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, company: true } },
          plan: { select: { id: true, name: true } },
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

  async create(input: CreateQuotationInput, actorId: string, ipAddress?: string) {
    const count = await prisma.quotation.count();
    const quotationNumber = generateQuotationNumber(count + 1);

    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          quotationNumber,
          customerId: input.customerId,
          planId: input.planId,
          templateId: input.templateId,
          notes: input.notes,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
          status: 'DRAFT',
          createdById: actorId,
        },
      });

      if (input.lines && input.lines.length > 0) {
        await tx.quotationLine.createMany({
          data: input.lines.map((l) => ({
            quotationId: q.id,
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        });
      }

      return q;
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.QUOTATION_CREATED,
      entityType: 'Quotation',
      entityId: quotation.id,
      changeDetails: { quotationNumber, customerId: input.customerId } as Record<string, unknown>,
      ipAddress,
    });

    return this.getById(quotation.id);
  },

  async getById(id: string) {
    const quotation = await prisma.quotation.findUnique({
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
      },
    });
    if (!quotation) throw createError('Quotation not found.', 404);
    return quotation;
  },

  async update(id: string, input: UpdateQuotationInput, actorId: string, ipAddress?: string) {
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) throw createError('Quotation not found.', 404);
    if (existing.status !== 'DRAFT') throw createError('Only DRAFT quotations can be edited.', 400);

    await prisma.$transaction(async (tx) => {
      await tx.quotation.update({
        where: { id },
        data: {
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.validUntil && { validUntil: new Date(input.validUntil) }),
        },
      });

      if (input.lines) {
        await tx.quotationLine.deleteMany({ where: { quotationId: id } });
        if (input.lines.length > 0) {
          await tx.quotationLine.createMany({
            data: input.lines.map((l) => ({
              quotationId: id,
              productId: l.productId,
              variantId: l.variantId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
            })),
          });
        }
      }
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.QUOTATION_UPDATED,
      entityType: 'Quotation',
      entityId: id,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return this.getById(id);
  },

  async confirm(id: string, actorId: string, ipAddress?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { plan: true, lines: true },
    });
    if (!quotation) throw createError('Quotation not found.', 404);
    if (quotation.status !== 'DRAFT') throw createError('Only DRAFT quotations can be confirmed.', 400);

    const subCount = await prisma.subscription.count();
    const subscriptionNumber = generateSubscriptionNumber(subCount + 1);
    const today = new Date();
    const nextBillingDate = calculateNextBillingDate(today, quotation.plan.billingInterval as any);

    const subscription = await prisma.$transaction(async (tx) => {
      await tx.quotation.update({ where: { id }, data: { status: 'CONFIRMED' } });

      const sub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: quotation.planId,
          quotationId: quotation.id,
          status: 'ACTIVE',
          startDate: today,
          nextBillingDate,
          createdById: actorId,
        },
      });

      if (quotation.lines.length > 0) {
        await tx.subscriptionLine.createMany({
          data: quotation.lines.map((l) => ({
            subscriptionId: sub.id,
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        });
      }

      return sub;
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.QUOTATION_CONFIRMED,
      entityType: 'Quotation',
      entityId: id,
      changeDetails: { subscriptionId: subscription.id, subscriptionNumber } as Record<string, unknown>,
      ipAddress,
    });

    return {
      message: 'Quotation confirmed and subscription created.',
      subscription: await prisma.subscription.findUnique({
        where: { id: subscription.id },
        include: { plan: true, customer: true, lines: true },
      }),
    };
  },

  async cancel(id: string, actorId: string, ipAddress?: string) {
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) throw createError('Quotation not found.', 404);
    if (quotation.status === 'CANCELLED') throw createError('Quotation is already cancelled.', 400);
    if (quotation.status === 'CONFIRMED') throw createError('Confirmed quotations cannot be cancelled.', 400);

    await prisma.quotation.update({ where: { id }, data: { status: 'CANCELLED' } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.QUOTATION_CANCELLED,
      entityType: 'Quotation',
      entityId: id,
      ipAddress,
    });

    return { message: 'Quotation cancelled.' };
  },
};
