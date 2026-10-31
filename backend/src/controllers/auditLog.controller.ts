import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const auditLogController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (req.query.action) where.action = req.query.action;
      if (req.query.entityType) where.entityType = req.query.entityType;
      if (req.query.userId) where.userId = req.query.userId;

      const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, role: true } },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
  },
};

