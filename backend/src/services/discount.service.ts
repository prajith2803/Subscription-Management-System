import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog } from '../utils/auditLogger';
import { Decimal } from '../utils/currencyUtils';

export const discountService = {
  async list(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { discountProducts: { include: { product: true } } },
      }),
      prisma.discount.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string) {
    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        discountProducts: { include: { product: true } },
        discountUsages: { take: 10, orderBy: { usedAt: 'desc' } },
      },
    });
    if (!discount) throw createError('Discount not found', 404);
    return discount;
  },

  async create(data: any, userId?: string, ipAddress?: string) {
    const existing = await prisma.discount.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw createError('Discount code already exists', 409);

    const discount = await prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        discountType: data.discountType || 'PERCENTAGE',
        value: data.value,
        minimumAmount: data.minimumAmount ?? 0,
        minimumQuantity: data.minimumQuantity ?? 1,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        maxUsageCount: data.maxUsageCount ?? null,
        isSubscriptionWide: data.isSubscriptionWide ?? true,
        isActive: data.isActive ?? true,
      },
    });

    if (Array.isArray(data.productIds) && data.productIds.length > 0 && !discount.isSubscriptionWide) {
      await prisma.discountProduct.createMany({
        data: data.productIds.map((productId: string) => ({
          discountId: discount.id,
          productId,
        })),
      });
    }

    await createAuditLog({
      userId,
      action: 'DISCOUNT_CREATED',
      entityType: 'Discount',
      entityId: discount.id,
      changeDetails: data,
      ipAddress,
    });

    return discount;
  },

  async update(id: string, data: any, userId?: string, ipAddress?: string) {
    await this.getById(id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minimumAmount !== undefined) updateData.minimumAmount = data.minimumAmount;
    if (data.minimumQuantity !== undefined) updateData.minimumQuantity = data.minimumQuantity;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.maxUsageCount !== undefined) updateData.maxUsageCount = data.maxUsageCount;
    if (data.isSubscriptionWide !== undefined) updateData.isSubscriptionWide = data.isSubscriptionWide;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.discount.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(data.productIds)) {
      await prisma.discountProduct.deleteMany({ where: { discountId: id } });
      if (data.productIds.length > 0 && !updated.isSubscriptionWide) {
        await prisma.discountProduct.createMany({
          data: data.productIds.map((productId: string) => ({
            discountId: id,
            productId,
          })),
        });
      }
    }

    await createAuditLog({
      userId,
      action: 'DISCOUNT_UPDATED',
      entityType: 'Discount',
      entityId: id,
      changeDetails: data,
      ipAddress,
    });

    return updated;
  },

  async remove(id: string, userId?: string, ipAddress?: string) {
    await this.getById(id);
    const updated = await prisma.discount.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId,
      action: 'DISCOUNT_DEACTIVATED',
      entityType: 'Discount',
      entityId: id,
      ipAddress,
    });

    return updated;
  },

  async checkEligibility(id: string, query: { amount?: string; quantity?: string; subscriptionId?: string }) {
    const discount = await this.getById(id);
    const now = new Date();

    if (!discount.isActive) {
      return { eligible: false, reason: 'Discount is not active' };
    }

    if (discount.startDate && now < new Date(discount.startDate)) {
      return { eligible: false, reason: 'Discount is not yet valid' };
    }

    if (discount.endDate && now > new Date(discount.endDate)) {
      return { eligible: false, reason: 'Discount has expired' };
    }

    if (discount.maxUsageCount !== null && discount.usageCount >= discount.maxUsageCount) {
      return { eligible: false, reason: 'Maximum usage limit reached' };
    }

    const amount = new Decimal(query.amount || '0');
    if (discount.minimumAmount && amount.lessThan(new Decimal(discount.minimumAmount.toString()))) {
      return { eligible: false, reason: `Minimum amount required is ₹${discount.minimumAmount}` };
    }

    const qty = parseInt(query.quantity || '1', 10);
    if (discount.minimumQuantity && qty < discount.minimumQuantity) {
      return { eligible: false, reason: `Minimum quantity required is ${discount.minimumQuantity}` };
    }

    let discountAmount = new Decimal(0);
    if (discount.discountType === 'PERCENTAGE') {
      discountAmount = amount.times(new Decimal(discount.value.toString())).dividedBy(100);
    } else {
      discountAmount = new Decimal(discount.value.toString());
    }

    if (discountAmount.greaterThan(amount)) {
      discountAmount = amount;
    }

    return {
      eligible: true,
      discountAmount: discountAmount.toFixed(2),
      discount,
    };
  },
};

