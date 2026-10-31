import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';

export const subscriptionController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;
      const planId = req.query.planId as string | undefined;

      // Customer can only see their own subscriptions
      const user = req.user!;
      const customerId = user.role === 'CUSTOMER' ? user.customerId : (req.query.customerId as string | undefined);

      const result = await subscriptionService.list({ page, limit, status, customerId, planId });
      res.json(result);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.getById(req.params.id);
      const user = req.user!;
      if (user.role === 'CUSTOMER' && subscription.customerId !== user.customerId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }
      res.json(subscription);
    } catch (err) { next(err); }
  },

  async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.pause(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.resume(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      const result = await subscriptionService.close(req.params.id, req.user!.userId, isAdmin, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async renew(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.renew(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },
};
