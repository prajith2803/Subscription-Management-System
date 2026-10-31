import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';

export const paymentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.list(req.query, req.user);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.getById(req.params.id, req.user);
      res.json(result);
    } catch (err) { next(err); }
  },

  async record(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.record(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },
};

