import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = req.query.search as string | undefined;
      const result = await customerService.list({ page, limit, search });
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.create(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(customer);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Customer role can only see own record
      const user = req.user!;
      if (user.role === 'CUSTOMER' && user.customerId !== req.params.id) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }
      const customer = await customerService.getById(req.params.id);
      res.json(customer);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.update(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.json(customer);
    } catch (err) { next(err); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.deactivate(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },
};
