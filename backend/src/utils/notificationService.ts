import { prisma } from '../config/database';
import { NotificationEventType } from '@prisma/client';
import { socketEvents } from '../config/socket';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  eventType: NotificationEventType;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId,
      },
    });

    // Emit to the specific user via Socket.IO
    try {
      socketEvents.emitToUser(payload.userId, 'notification:new', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        eventType: notification.eventType,
        createdAt: notification.createdAt,
      });
    } catch {
      // Socket might not be initialized yet (e.g., during startup)
    }
  } catch (err) {
    console.error('⚠️  Failed to create notification:', err);
  }
}

/**
 * Notify all admin and staff users about an event
 */
export async function notifyStaff(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
  try {
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, isActive: true },
      select: { id: true },
    });

    await Promise.all(
      staffUsers.map((u) => createNotification({ ...payload, userId: u.id }))
    );
  } catch (err) {
    console.error('⚠️  Failed to notify staff:', err);
  }
}

