import { Request, Response, NextFunction } from 'express';
import { verifyToken, TOKEN_COOKIE_NAME, TokenPayload } from '../utils/tokenUtils';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[TOKEN_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Ensure a customer can only access their own data.
 * For Admin/Staff: pass through. For Customer: validate customerId param matches.
 */
export function ownOrAdmin(paramName = 'customerId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      next();
      return;
    }

    // Customer role: enforce data isolation
    const paramId = req.params[paramName];
    if (!paramId || paramId !== user.customerId) {
      res.status(403).json({ error: 'Access denied. You can only access your own data.' });
      return;
    }

    next();
  };
}

