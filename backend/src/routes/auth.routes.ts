import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { env } from '../config/env';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

export default router;

