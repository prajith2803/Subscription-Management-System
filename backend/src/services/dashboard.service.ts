import { prisma } from '../config/database';
import { Decimal } from '../utils/currencyUtils';

export const dashboardService = {
  async getKpis() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      totalSubscriptions,
      activeSubscriptions,
      newSubscriptionsThisMonth,
      totalInvoices,
      allPayments,
      allInvoices,
      overdueInvoicesCount,
    ] = await Promise.all([
      prisma.customer.count({ where: { isActive: true } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.invoice.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.invoice.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { outstandingBalance: true, grandTotal: true },
      }),
      prisma.invoice.count({
        where: {
          OR: [
            { status: 'OVERDUE' },
            {
              dueDate: { lt: now },
              outstandingBalance: { gt: 0 },
              status: { in: ['CONFIRMED', 'PARTIALLY_PAID'] },
            },
          ],
        },
      }),
    ]);

    const totalRevenue = allPayments._sum.amount ? new Decimal(allPayments._sum.amount.toString()).toFixed(2) : '0.00';
    const outstandingAmount = allInvoices._sum.outstandingBalance ? new Decimal(allInvoices._sum.outstandingBalance.toString()).toFixed(2) : '0.00';
    const totalBilled = allInvoices._sum.grandTotal ? new Decimal(allInvoices._sum.grandTotal.toString()).toFixed(2) : '0.00';

    return {
      totalCustomers,
      totalSubscriptions,
      activeSubscriptions,
      newSubscriptionsThisMonth,
      totalInvoices,
      totalRevenue,
      outstandingAmount,
      totalBilled,
      overdueInvoicesCount,
    };
  },

  async getCharts() {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Fetch payments over last 12 months
    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: twelveMonthsAgo } },
      select: { amount: true, paymentDate: true },
    });

    // Fetch invoices over last 12 months
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: twelveMonthsAgo },
        status: { not: 'CANCELLED' },
      },
      select: { grandTotal: true, invoiceDate: true, status: true },
    });

    // Month map helper
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { month: string; revenue: number; billed: number }>();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyMap.set(key, { month: key, revenue: 0, billed: 0 });
    }

    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.revenue += Number(p.amount);
      }
    });

    invoices.forEach((inv) => {
      const d = new Date(inv.invoiceDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.billed += Number(inv.grandTotal);
      }
    });

    const monthlyRevenue = Array.from(monthlyMap.values());

    // Subscription status breakdown
    const subStatuses = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const subscriptionStatusDist = subStatuses.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    // Invoice status breakdown
    const invStatuses = await prisma.invoice.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const invoiceStatusDist = invStatuses.map((s) => ({
      status: s.status,
      count: s._count.status,
    }));

    // Revenue by Plan
    const subscriptionsWithPlan = await prisma.subscription.findMany({
      include: {
        plan: true,
        invoices: {
          include: { payments: true },
        },
      },
    });

    const planRevenueMap = new Map<string, number>();
    subscriptionsWithPlan.forEach((sub) => {
      const planName = sub.plan.name;
      const subRev = sub.invoices.reduce((sum, inv) => {
        return sum + inv.payments.reduce((pSum, pay) => pSum + Number(pay.amount), 0);
      }, 0);
      planRevenueMap.set(planName, (planRevenueMap.get(planName) || 0) + subRev);
    });

    const revenueByPlan = Array.from(planRevenueMap.entries()).map(([plan, revenue]) => ({
      plan,
      revenue: Math.round(revenue * 100) / 100,
    }));

    return {
      monthlyRevenue,
      subscriptionStatusDist,
      invoiceStatusDist,
      revenueByPlan,
    };
  },
};

