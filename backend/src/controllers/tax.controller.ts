import { Request, Response, NextFunction } from 'express';
import { taxService } from '../services/tax.service';

export const taxController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxService.list(req.query);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxService.getById(req.params.id);
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxService.create(req.body, req.user?.userId, (req as any).clientIp);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxService.update(req.params.id, req.body, req.user?.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taxService.remove(req.params.id, req.user?.userId, (req as any).clientIp);
      res.json({ message: 'Tax rule deactivated successfully', data: result });
    } catch (err) { next(err); }
  },
};

