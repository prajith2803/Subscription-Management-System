import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createError(message: string, statusCode = 500): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

export function errorHandler(
  err: AppError | ZodError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  // Handle Prisma unique constraint violations
  if ((err as any).code === 'P2002') {
    const fields = (err as any).meta?.target?.join(', ') || 'field';
    res.status(409).json({ error: `A record with this ${fields} already exists.` });
    return;
  }

  // Handle Prisma record not found
  if ((err as any).code === 'P2025') {
    res.status(404).json({ error: 'Record not found.' });
    return;
  }

  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const message = appErr.isOperational
    ? appErr.message
    : env.isDev
    ? appErr.message
    : 'An unexpected error occurred';

  if (!appErr.isOperational) {
    console.error('❌ Unexpected error:', err);
  }

  res.status(statusCode).json({
    error: message,
    ...(env.isDev && !appErr.isOperational && { stack: appErr.stack }),
  });
}

