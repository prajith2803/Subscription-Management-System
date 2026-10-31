import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { TOKEN_COOKIE_NAME, COOKIE_OPTIONS } from '../utils/tokenUtils';

export const authController = {

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body, (req as any).clientIp);
      res.status(201).json({ message: 'Account created successfully.', user: result });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body, (req as any).clientIp);
      res.cookie(TOKEN_COOKIE_NAME, result.token, COOKIE_OPTIONS);
      res.json({ message: 'Login successful.', user: result.user });
    } catch (err) { next(err); }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie(TOKEN_COOKIE_NAME, { path: '/' });
      res.json({ message: 'Logged out successfully.' });
    } catch (err) { next(err); }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) { next(err); }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(
        req.params.token,
        req.body.password,
        (req as any).clientIp
      );
      res.json(result);
    } catch (err) { next(err); }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req.user!.userId);
      res.json(result);
    } catch (err) { next(err); }
  },
};

