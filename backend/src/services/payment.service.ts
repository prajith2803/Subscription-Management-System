import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { createAuditLog } from '../utils/auditLogger';
import { socketEvents } from '../config/socket';
import { Decimal } from '../utils/currencyUtils';
import { createNotification, notifyStaff } from '../utils/notificationService';

export const paymentService = {
  async list(query: any, user?: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (user?.role === 'CUSTOMER') {
      if (!user.customerId) throw createError('Customer profile not found', 403);
      where.customerId = user.customerId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, company: true } },
          invoice: { select: { id: true, invoiceNumber: true, grandTotal: true, outstandingBalance: true, status: true } },
          recordedBy: { select: { id: true, email: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(id: string, user?: any) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: { include: { lines: true } },
        recordedBy: { select: { id: true, email: true } },
      },
    });

    if (!payment) throw createError('Payment record not found', 404);

    if (user?.role === 'CUSTOMER' && payment.customerId !== user.customerId) {
      throw createError('Access denied: You cannot view another customer\'s payment', 403);
    }

    return payment;
  },

  async record(data: any, recordedByUserId: string, ipAddress?: string) {
    const paymentAmount = new Decimal(data.amount);
    if (paymentAmount.lessThanOrEqualTo(0)) {
      throw createError('Payment amount must be greater than zero', 400);
    }

    // Use transaction for strict financial reconciliation
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { customer: { include: { user: true } } },
      });

      if (!invoice) throw createError('Invoice not found', 404);
      if (invoice.status === 'PAID') throw createError('Invoice is already fully paid', 400);
      if (invoice.status === 'CANCELLED') throw createError('Cannot accept payments for a cancelled invoice', 400);

      const outstanding = new Decimal(invoice.outstandingBalance.toString());
      if (paymentAmount.greaterThan(outstanding)) {
        throw createError(
          `Payment amount (₹${paymentAmount.toFixed(2)}) exceeds outstanding balance (₹${outstanding.toFixed(2)})`,
          400
        );
      }

      const newPaid = new Decimal(invoice.amountPaid.toString()).plus(paymentAmount);
      const newOutstanding = outstanding.minus(paymentAmount);
      const newStatus = newOutstanding.isZero() ? 'PAID' : 'PARTIALLY_PAID';

      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          recordedByUserId,
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          amount: paymentAmount.toNumber(),
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          transactionReference: data.transactionReference || null,
          notes: data.notes || null,
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newPaid.toNumber(),
          outstandingBalance: newOutstanding.toNumber(),
          status: newStatus,
        },
      });

      return { payment, invoice: updatedInvoice, customerUser: invoice.customer.user };
    });

    // Post-transaction notifications and events
    await createAuditLog({
      userId: recordedByUserId,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: result.payment.id,
      changeDetails: {
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        amount: data.amount,
        newStatus: result.invoice.status,
      },
      ipAddress,
    });

    socketEvents.emitToStaff('payment:recorded', result.payment);
    socketEvents.emitToStaff('invoice:statusChanged', {
      id: result.invoice.id,
      status: result.invoice.status,
      amountPaid: result.invoice.amountPaid,
      outstandingBalance: result.invoice.outstandingBalance,
    });
    if (result.invoice.customerId) {
      socketEvents.emitToCustomer(result.invoice.customerId, 'payment:recorded', result.payment);
      socketEvents.emitToCustomer(result.invoice.customerId, 'invoice:statusChanged', result.invoice);
    }
    socketEvents.emitDashboardRefresh();

    if (result.customerUser) {
      await createNotification({
        userId: result.customerUser.id,
        title: 'Payment Recorded',
        message: `A payment of ₹${paymentAmount.toFixed(2)} was received for invoice ${result.invoice.invoiceNumber}.`,
        eventType: 'PAYMENT_RECORDED',
        entityType: 'Invoice',
        entityId: result.invoice.id,
      });
    }

    await notifyStaff({
      title: 'Payment Received',
      message: `₹${paymentAmount.toFixed(2)} recorded for ${result.invoice.invoiceNumber} (${result.invoice.status}).`,
      eventType: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: result.payment.id,
    });

    return result;
  },
};

