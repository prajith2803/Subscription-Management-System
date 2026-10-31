import { Request, Response, NextFunction } from 'express';
import { quotationService } from '../services/quotation.service';

export const quotationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const customerId = req.query.customerId as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await quotationService.list({ page, limit, customerId, status });
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.create(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(quotation);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const quotation = await quotationService.getById(req.params.id);
      // Customer isolation
      if (user.role === 'CUSTOMER' && quotation.customerId !== user.customerId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }
      res.json(quotation);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.update(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.json(quotation);
    } catch (err) { next(err); }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quotationService.confirm(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quotationService.cancel(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },
};
