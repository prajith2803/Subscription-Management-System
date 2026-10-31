import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog } from '../utils/auditLogger';
import { generateInvoicePdfBuffer } from '../utils/pdfGenerator';
import { socketEvents } from '../config/socket';

export const invoiceService = {
  async list(query: any, user?: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Customer isolation
    if (user?.role === 'CUSTOMER') {
      if (!user.customerId) throw createError('Customer profile not found', 403);
      where.customerId = user.customerId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) where.status = query.status;
    if (query.subscriptionId) where.subscriptionId = query.subscriptionId;
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Auto-detect and mark overdue invoices
    const now = new Date();
    await prisma.invoice.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
        outstandingBalance: { gt: 0 },
      },
      data: { status: 'OVERDUE' },
    });

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, company: true } },
          subscription: { select: { id: true, subscriptionNumber: true } },
          lines: true,
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string, user?: any) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: true,
        lines: { include: { product: true, variant: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) throw createError('Invoice not found', 404);

    if (user?.role === 'CUSTOMER' && invoice.customerId !== user.customerId) {
      throw createError('Access denied: You cannot view another customer\'s invoice', 403);
    }

    return invoice;
  },

  async confirm(id: string, userId?: string, ipAddress?: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw createError('Invoice not found', 404);
    if (invoice.status !== 'DRAFT') {
      throw createError(`Cannot confirm invoice with status ${invoice.status}`, 400);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    await createAuditLog({
      userId,
      action: 'INVOICE_CONFIRMED',
      entityType: 'Invoice',
      entityId: id,
      ipAddress,
    });

    socketEvents.emitToStaff('invoice:statusChanged', { id, status: 'CONFIRMED' });
    if (invoice.customerId) {
      socketEvents.emitToCustomer(invoice.customerId, 'invoice:statusChanged', { id, status: 'CONFIRMED' });
    }

    return updated;
  },

  async cancel(id: string, userId?: string, ipAddress?: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw createError('Invoice not found', 404);
    if (invoice.status === 'PAID') {
      throw createError('Cannot cancel a fully paid invoice', 400);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await createAuditLog({
      userId,
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: id,
      ipAddress,
    });

    socketEvents.emitToStaff('invoice:statusChanged', { id, status: 'CANCELLED' });
    return updated;
  },

  async getPdf(id: string, user?: any): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.getById(id, user);

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      billingPeriodStart: invoice.billingPeriodStart.toISOString().split('T')[0],
      billingPeriodEnd: invoice.billingPeriodEnd.toISOString().split('T')[0],
      status: invoice.status,
      customer: {
        name: invoice.customer.name,
        company: invoice.customer.company,
        address: invoice.customer.address,
        city: invoice.customer.city,
        state: invoice.customer.state,
        country: invoice.customer.country,
        taxId: invoice.customer.taxId,
      },
      subscriptionNumber: invoice.subscription?.subscriptionNumber,
      lines: invoice.lines.map((line) => ({
        productNameSnapshot: line.productNameSnapshot,
        variantNameSnapshot: line.variantNameSnapshot,
        quantity: line.quantity,
        unitPriceSnapshot: line.unitPriceSnapshot.toString(),
        discountAmount: line.discountAmount.toString(),
        taxRate: line.taxRate.toString(),
        taxAmount: line.taxAmount.toString(),
        lineTotal: line.lineTotal.toString(),
      })),
      subtotal: invoice.subtotal.toString(),
      discountAmount: invoice.discountAmount.toString(),
      taxAmount: invoice.taxAmount.toString(),
      grandTotal: invoice.grandTotal.toString(),
      amountPaid: invoice.amountPaid.toString(),
      outstandingBalance: invoice.outstandingBalance.toString(),
    });

    return {
      buffer: pdfBuffer,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  },
};

