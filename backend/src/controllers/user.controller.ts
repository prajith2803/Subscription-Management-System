import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const role = req.query.role as string | undefined;
      const result = await userService.list({ page, limit, role });
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(user);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id);
      res.json(user);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.json(user);
    } catch (err) { next(err); }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.deactivate(req.params.id, req.user!.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },
};
