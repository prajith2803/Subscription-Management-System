import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  async getKpis(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getKpis();
      res.json(result);
    } catch (err) { next(err); }
  },

  async getCharts(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getCharts();
      res.json(result);
    } catch (err) { next(err); }
  },
};

