import { Request, Response, NextFunction } from 'express';
import { planService } from '../services/plan.service';

export const planController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const result = await planService.list({ page, limit });
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.create(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(plan);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.getById(req.params.id);
      res.json(plan);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.update(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.json(plan);
    } catch (err) { next(err); }
  },

  async addProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await planService.addProduct(req.params.id, req.body, req.user!.userId);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async removeProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await planService.removeProduct(req.params.id, req.params.planProductId, req.user!.userId);
      res.json(result);
    } catch (err) { next(err); }
  },
};
