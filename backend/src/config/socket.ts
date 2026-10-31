import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './env';
import { verifyToken } from '../utils/tokenUtils';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    // Authenticate socket connections via token from handshake auth
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user) return;

    // Join role-specific rooms
    socket.join(`user:${user.userId}`);
    socket.join(`role:${user.role}`);

    if (user.role === 'ADMIN') socket.join('admin');
    if (user.role === 'ADMIN' || user.role === 'STAFF') socket.join('staff');
    if (user.role === 'CUSTOMER' && user.customerId) {
      socket.join(`customer:${user.customerId}`);
    }

    socket.on('disconnect', () => {
      // cleanup handled by Socket.IO automatically
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Typed event emitters
export const socketEvents = {
  emitToUser(userId: string, event: string, data: unknown) {
    getIO().to(`user:${userId}`).emit(event, data);
  },
  emitToCustomer(customerId: string, event: string, data: unknown) {
    getIO().to(`customer:${customerId}`).emit(event, data);
  },
  emitToStaff(event: string, data: unknown) {
    getIO().to('staff').emit(event, data);
  },
  emitToAdmin(event: string, data: unknown) {
    getIO().to('admin').emit(event, data);
  },
  emitDashboardRefresh() {
    getIO().to('admin').emit('dashboard:refresh', {});
    getIO().to('staff').emit('dashboard:refresh', {});
  },
};

