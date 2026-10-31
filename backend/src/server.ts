import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocket } from './config/socket';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import planRoutes from './routes/plan.routes';
import quotationTemplateRoutes from './routes/quotationTemplate.routes';
import quotationRoutes from './routes/quotation.routes';
import subscriptionRoutes from './routes/subscription.routes';
import taxRoutes from './routes/tax.routes';
import discountRoutes from './routes/discount.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import billingRoutes from './routes/billing.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import auditLogRoutes from './routes/auditLog.routes';
import portalRoutes from './routes/portal.routes';

import { startBillingScheduler } from './jobs/billingScheduler';

const app = express();
const httpServer = http.createServer(app);

// ─── Security middleware ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ─── Body & Cookie parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── Logging ──────────────────────────────────────────────────────────────
if (env.isDev) app.use(morgan('dev'));
app.use(requestLogger);

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ───────────────────────────────────────────────────────────
const api = '/api/v1';

app.use(`${api}/auth`, authRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/customers`, customerRoutes);
app.use(`${api}/products`, productRoutes);
app.use(`${api}/plans`, planRoutes);
app.use(`${api}/quotation-templates`, quotationTemplateRoutes);
app.use(`${api}/quotations`, quotationRoutes);
app.use(`${api}/subscriptions`, subscriptionRoutes);
app.use(`${api}/taxes`, taxRoutes);
app.use(`${api}/discounts`, discountRoutes);
app.use(`${api}/invoices`, invoiceRoutes);
app.use(`${api}/payments`, paymentRoutes);
app.use(`${api}/billing`, billingRoutes);
app.use(`${api}/dashboard`, dashboardRoutes);
app.use(`${api}/notifications`, notificationRoutes);
app.use(`${api}/audit-logs`, auditLogRoutes);
app.use(`${api}/portal`, portalRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDatabase();

  // Initialize Socket.IO
  initSocket(httpServer);

  // Start billing cron scheduler
  startBillingScheduler();

  httpServer.listen(env.PORT, () => {
    console.log(`\n🚀 Brightloop SMS Backend running on port ${env.PORT}`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
    console.log(`   API Base    : http://localhost:${env.PORT}/api/v1`);
    console.log(`   Health      : http://localhost:${env.PORT}/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  httpServer.close(async () => {
    await disconnectDatabase();
    console.log('Server closed. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

