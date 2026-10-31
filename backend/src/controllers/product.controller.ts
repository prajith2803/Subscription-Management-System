import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
      const result = await productService.list({ page, limit, active });
      res.json(result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(product);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);
      res.json(product);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.json(product);
    } catch (err) { next(err); }
  },

  async listVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const variants = await productService.listVariants(req.params.id);
      res.json(variants);
    } catch (err) { next(err); }
  },

  async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.createVariant(req.params.id, req.body, req.user!.userId, (req as any).clientIp);
      res.status(201).json(variant);
    } catch (err) { next(err); }
  },

  async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.updateVariant(req.params.id, req.params.variantId, req.body, req.user!.userId, (req as any).clientIp);
      res.json(variant);
    } catch (err) { next(err); }
  },
};
