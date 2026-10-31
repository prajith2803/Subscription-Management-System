import { Request, Response, NextFunction } from 'express';
import { runBillingJob } from '../jobs/billingRunner';
import { prisma } from '../config/database';
import { createAuditLog } from '../utils/auditLogger';

export const billingController = {
  async runBilling(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await runBillingJob(`MANUAL_BY_USER_${req.user?.email || 'ADMIN'}`);
      await createAuditLog({
        userId: req.user?.userId,
        action: 'BILLING_RUN_TRIGGERED',
        entityType: 'BillingJob',
        entityId: result.jobId,
        changeDetails: result,
        ipAddress: (req as any).clientIp,
      });
      res.json({ message: 'Billing run completed', result });
    } catch (err) { next(err); }
  },

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.billingJobLog.findMany({
          skip,
          take: limit,
          orderBy: { startedAt: 'desc' },
        }),
        prisma.billingJobLog.count(),
      ]);

      res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
  },
};

