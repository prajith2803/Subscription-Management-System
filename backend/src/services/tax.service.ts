import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog } from '../utils/auditLogger';

export const taxService = {
  async list(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.taxRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { taxRuleProducts: { include: { product: true } } },
      }),
      prisma.taxRule.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string) {
    const tax = await prisma.taxRule.findUnique({
      where: { id },
      include: { taxRuleProducts: { include: { product: true } } },
    });
    if (!tax) throw createError('Tax rule not found', 404);
    return tax;
  },

  async create(data: any, userId?: string, ipAddress?: string) {
    const tax = await prisma.taxRule.create({
      data: {
        name: data.name,
        percentage: data.percentage ?? 0,
        fixedAmount: data.fixedAmount ?? 0,
        taxType: data.taxType || 'PERCENTAGE',
        appliesToAll: data.appliesToAll ?? true,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isActive: data.isActive ?? true,
      },
    });

    if (Array.isArray(data.productIds) && data.productIds.length > 0 && !tax.appliesToAll) {
      await prisma.taxRuleProduct.createMany({
        data: data.productIds.map((productId: string) => ({
          taxRuleId: tax.id,
          productId,
        })),
      });
    }

    await createAuditLog({
      userId,
      action: 'TAX_CREATED',
      entityType: 'TaxRule',
      entityId: tax.id,
      changeDetails: data,
      ipAddress,
    });

    return tax;
  },

  async update(id: string, data: any, userId?: string, ipAddress?: string) {
    await this.getById(id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;
    if (data.fixedAmount !== undefined) updateData.fixedAmount = data.fixedAmount;
    if (data.taxType !== undefined) updateData.taxType = data.taxType;
    if (data.appliesToAll !== undefined) updateData.appliesToAll = data.appliesToAll;
    if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : null;
    if (data.effectiveTo !== undefined) updateData.effectiveTo = data.effectiveTo ? new Date(data.effectiveTo) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.taxRule.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(data.productIds)) {
      await prisma.taxRuleProduct.deleteMany({ where: { taxRuleId: id } });
      if (data.productIds.length > 0 && !updated.appliesToAll) {
        await prisma.taxRuleProduct.createMany({
          data: data.productIds.map((productId: string) => ({
            taxRuleId: id,
            productId,
          })),
        });
      }
    }

    await createAuditLog({
      userId,
      action: 'TAX_UPDATED',
      entityType: 'TaxRule',
      entityId: id,
      changeDetails: data,
      ipAddress,
    });

    return updated;
  },

  async remove(id: string, userId?: string, ipAddress?: string) {
    await this.getById(id);
    const updated = await prisma.taxRule.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId,
      action: 'TAX_DEACTIVATED',
      entityType: 'TaxRule',
      entityId: id,
      ipAddress,
    });

    return updated;
  },
};

