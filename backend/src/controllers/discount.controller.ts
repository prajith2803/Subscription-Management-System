import { Request, Response, NextFunction } from 'express';
import { discountService } from '../services/discount.service';

export const discountController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountService.list(req.query);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountService.getById(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountService.create(req.body, req.user?.userId, (req as any).clientIp);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountService.update(req.params.id, req.body, req.user?.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountService.remove(req.params.id, req.user?.userId, (req as any).clientIp);
      res.json({ message: 'Discount deactivated successfully', data: result });
    } catch (err) { next(err); }
  },

  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await discountService.checkEligibility(req.params.id, req.query as any);
      res.json(result);
    } catch (err) { next(err); }
  },
};

