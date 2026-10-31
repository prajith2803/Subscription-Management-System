import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service';

export const invoiceController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.list(req.query, req.user);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.getById(req.params.id, req.user);
      res.json(result);
    } catch (err) { next(err); }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.confirm(req.params.id, req.user?.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.cancel(req.params.id, req.user?.userId, (req as any).clientIp);
      res.json(result);
    } catch (err) { next(err); }
  },

  async getPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { buffer, filename } = await invoiceService.getPdf(req.params.id, req.user);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) { next(err); }
  },
};

