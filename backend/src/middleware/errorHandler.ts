import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode} - ${message}`);
  if (!config.isProduction) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: config.isProduction ? undefined : err.stack,
    error: config.isProduction ? undefined : err
  });
};
