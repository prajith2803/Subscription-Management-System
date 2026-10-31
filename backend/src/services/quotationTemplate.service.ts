import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog } from '../utils/auditLogger';

interface TemplateLine {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number | string;
  description?: string;
}

interface CreateTemplateInput {
  name: string;
  description?: string;
  planId?: string;
  lines?: TemplateLine[];
}

interface UpdateTemplateInput {
  name?: string;
  description?: string;
  planId?: string;
  lines?: TemplateLine[];
}

export const quotationTemplateService = {
  async list(opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.quotationTemplate.count(),
      prisma.quotationTemplate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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

  async create(input: CreateTemplateInput, actorId: string, ipAddress?: string) {
    const template = await prisma.$transaction(async (tx) => {
      const t = await tx.quotationTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          ...(input.planId && { planId: input.planId }),
        },
      });

      if (input.lines && input.lines.length > 0) {
        await tx.quotationTemplateLine.createMany({
          data: input.lines.map((l) => ({
            templateId: t.id,
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            description: l.description,
          })),
        });
      }

      return t;
    });

    await createAuditLog({
      userId: actorId,
      action: 'QUOTATION_TEMPLATE_CREATED',
      entityType: 'QuotationTemplate',
      entityId: template.id,
      changeDetails: { name: input.name } as Record<string, unknown>,
      ipAddress,
    });

    return this.getById(template.id);
  },

  async getById(id: string) {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });
    if (!template) throw createError('Quotation template not found.', 404);
    return template;
  },

  async update(id: string, input: UpdateTemplateInput, actorId: string, ipAddress?: string) {
    const existing = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!existing) throw createError('Quotation template not found.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.quotationTemplate.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.planId !== undefined && { planId: input.planId }),
        },
      });

      if (input.lines) {
        await tx.quotationTemplateLine.deleteMany({ where: { templateId: id } });
        if (input.lines.length > 0) {
          await tx.quotationTemplateLine.createMany({
            data: input.lines.map((l) => ({
              templateId: id,
              productId: l.productId,
              variantId: l.variantId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              description: l.description,
            })),
          });
        }
      }
    });

    await createAuditLog({
      userId: actorId,
      action: 'QUOTATION_TEMPLATE_UPDATED',
      entityType: 'QuotationTemplate',
      entityId: id,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return this.getById(id);
  },
};
