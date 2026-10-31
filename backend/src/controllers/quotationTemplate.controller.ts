import { Request, Response, NextFunction } from 'express';
import { quotationTemplateService } from '../services/quotationTemplate.service';

export const quotationTemplateController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const result = await quotationTemplateService.list({ page, limit });
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await quotationTemplateService.create(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(template);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await quotationTemplateService.getById(req.params.id);
      res.json(template);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await quotationTemplateService.update(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.json(template);
    } catch (err) { next(err); }
  },
};
