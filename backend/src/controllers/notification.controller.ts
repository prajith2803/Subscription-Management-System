import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const where: any = { userId: req.user!.userId };
      if (req.query.unreadOnly === 'true') {
        where.isRead = false;
      }

      const [data, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
      ]);

      res.json({ data, total, page, limit, unreadCount, totalPages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
      if (!notif) throw createError('Notification not found', 404);
      if (notif.userId !== req.user!.userId) throw createError('Access denied', 403);

      const updated = await prisma.notification.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });

      res.json(updated);
    } catch (err) { next(err); }
  },

  async readAll(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, isRead: false },
        data: { isRead: true },
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (err) { next(err); }
  },
};

