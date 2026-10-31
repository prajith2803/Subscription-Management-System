import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  // Attach IP address to request for audit logging
  (req as any).clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';
  next();
}

