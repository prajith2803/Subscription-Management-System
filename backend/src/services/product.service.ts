import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog, AuditActions } from '../utils/auditLogger';
import { toDecimal, add } from '../utils/currencyUtils';

interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  salesPrice: number | string;
  isActive?: boolean;
}

interface UpdateProductInput {
  name?: string;
  description?: string;
  sku?: string;
  salesPrice?: number | string;
  isActive?: boolean;
}

interface CreateVariantInput {
  name: string;
  description?: string;
  additionalPrice: number | string;
  sku?: string;
  isActive?: boolean;
}

interface UpdateVariantInput {
  name?: string;
  description?: string;
  additionalPrice?: number | string;
  sku?: string;
  isActive?: boolean;
}

export const productService = {
  async list(opts: { page: number; limit: number; active?: boolean }) {
    const { page, limit, active } = opts;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (active !== undefined) where.isActive = active;

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { variants: { where: { isActive: true } } },
      }),
    ]);

    // Add effectivePrice to variants
    const enriched = data.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({
        ...v,
        effectivePrice: add(toDecimal(p.salesPrice), toDecimal(v.additionalPrice)).toNumber(),
      })),
    }));

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(input: CreateProductInput, actorId: string, ipAddress?: string) {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        sku: input.sku,
        salesPrice: input.salesPrice,
        isActive: input.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.PRODUCT_CREATED,
      entityType: 'Product',
      entityId: product.id,
      changeDetails: { name: input.name } as Record<string, unknown>,
      ipAddress,
    });

    return product;
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });
    if (!product) throw createError('Product not found.', 404);

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        effectivePrice: add(toDecimal(product.salesPrice), toDecimal(v.additionalPrice)).toNumber(),
      })),
    };
  },

  async update(id: string, input: UpdateProductInput, actorId: string, ipAddress?: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw createError('Product not found.', 404);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.salesPrice !== undefined && { salesPrice: input.salesPrice }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: id,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return product;
  },

  async listVariants(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw createError('Product not found.', 404);

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return variants.map((v) => ({
      ...v,
      effectivePrice: add(toDecimal(product.salesPrice), toDecimal(v.additionalPrice)).toNumber(),
    }));
  },

  async createVariant(productId: string, input: CreateVariantInput, actorId: string, ipAddress?: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw createError('Product not found.', 404);

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: input.name,
        description: input.description,
        additionalPrice: input.additionalPrice,
        sku: input.sku,
        isActive: input.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.VARIANT_CREATED,
      entityType: 'ProductVariant',
      entityId: variant.id,
      changeDetails: { productId, name: input.name } as Record<string, unknown>,
      ipAddress,
    });

    return {
      ...variant,
      effectivePrice: add(toDecimal(product.salesPrice), toDecimal(variant.additionalPrice)).toNumber(),
    };
  },

  async updateVariant(productId: string, variantId: string, input: UpdateVariantInput, actorId: string, ipAddress?: string) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw createError('Variant not found.', 404);

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.additionalPrice !== undefined && { additionalPrice: input.additionalPrice }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    const product = await prisma.product.findUnique({ where: { id: productId } });

    await createAuditLog({
      userId: actorId,
      action: AuditActions.VARIANT_UPDATED,
      entityType: 'ProductVariant',
      entityId: variantId,
      changeDetails: input as Record<string, unknown>,
      ipAddress,
    });

    return {
      ...updated,
      effectivePrice: add(toDecimal(product!.salesPrice), toDecimal(updated.additionalPrice)).toNumber(),
    };
  },
};
