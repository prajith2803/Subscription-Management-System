import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  COOKIE_SECRET: required('COOKIE_SECRET'),

  SMTP_HOST: optional('SMTP_HOST'),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_SECURE: optional('SMTP_SECURE', 'false') === 'true',
  SMTP_USER: optional('SMTP_USER'),
  SMTP_PASS: optional('SMTP_PASS'),
  EMAIL_FROM: optional('EMAIL_FROM', 'Brightloop Software <noreply@brightloop.com>'),

  BILLING_CRON: optional('BILLING_CRON', '0 1 * * *'),

  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
  AUTH_RATE_LIMIT_MAX: parseInt(optional('AUTH_RATE_LIMIT_MAX', '5'), 10),

  get isDev() { return this.NODE_ENV === 'development'; },
  get isProd() { return this.NODE_ENV === 'production'; },
};

