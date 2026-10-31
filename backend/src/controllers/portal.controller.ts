import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { invoiceService } from '../services/invoice.service';

export const portalController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) throw createError('Customer profile not found', 403);

      const [activeSubscriptions, nextBillingSub, invoicesAggregate, recentInvoices] = await Promise.all([
        prisma.subscription.count({
          where: { customerId, status: 'ACTIVE' },
        }),
        prisma.subscription.findFirst({
          where: { customerId, status: 'ACTIVE' },
          orderBy: { nextBillingDate: 'asc' },
          include: { plan: true },
        }),
        prisma.invoice.aggregate({
          where: { customerId, status: { not: 'CANCELLED' } },
          _sum: { outstandingBalance: true, amountPaid: true, grandTotal: true },
        }),
        prisma.invoice.findMany({
          where: { customerId },
          take: 5,
          orderBy: { invoiceDate: 'desc' },
          include: { subscription: { select: { subscriptionNumber: true } } },
        }),
      ]);

      res.json({
        activeSubscriptions,
        nextBillingDate: nextBillingSub?.nextBillingDate || null,
        nextBillingAmount: nextBillingSub?.monthlyValue || null,
        nextBillingPlan: nextBillingSub?.plan.name || null,
        totalOutstanding: invoicesAggregate._sum.outstandingBalance || 0,
        totalPaid: invoicesAggregate._sum.amountPaid || 0,
        totalInvoiced: invoicesAggregate._sum.grandTotal || 0,
        recentInvoices,
      });
    } catch (err) { next(err); }
  },

  async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) throw createError('Customer profile not found', 403);

      const subscriptions = await prisma.subscription.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
          lines: { include: { product: true, variant: true } },
        },
      });

      res.json(subscriptions);
    } catch (err) { next(err); }
  },

  async getSubscriptionById(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) throw createError('Customer profile not found', 403);

      const sub = await prisma.subscription.findUnique({
        where: { id: req.params.id },
        include: {
          plan: true,
          lines: { include: { product: true, variant: true } },
          invoices: {
            orderBy: { invoiceDate: 'desc' },
            select: { id: true, invoiceNumber: true, invoiceDate: true, dueDate: true, grandTotal: true, status: true, outstandingBalance: true },
          },
        },
      });

      if (!sub || sub.customerId !== customerId) {
        throw createError('Subscription not found', 404);
      }

      res.json(sub);
    } catch (err) { next(err); }
  },

  async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.list(req.query, req.user);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.getById(req.params.id, req.user);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getInvoicePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await invoiceService.getPdf(req.params.id, req.user);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) { next(err); }
  },

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user?.customerId;
      if (!customerId) throw createError('Customer profile not found', 403);

      const payments = await prisma.payment.findMany({
        where: { customerId },
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: { select: { id: true, invoiceNumber: true, grandTotal: true } },
        },
      });

      res.json(payments);
    } catch (err) { next(err); }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { userId: req.user!.userId },
        include: { user: { select: { email: true, createdAt: true } } },
      });

      if (!customer) throw createError('Customer profile not found', 404);
      res.json(customer);
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, company, address, city, state, country, pincode, taxId } = req.body;

      const updated = await prisma.customer.update({
        where: { userId: req.user!.userId },
        data: { name, phone, company, address, city, state, country, pincode, taxId },
      });

      res.json(updated);
    } catch (err) { next(err); }
  },
};

