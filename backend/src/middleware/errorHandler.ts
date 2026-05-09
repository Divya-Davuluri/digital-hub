import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode} - ${message}`);
  if (!config.isProduction) {
    console.error(err.stack);
  }

  try {
    res.status(statusCode).json({
      success: false,
      message: String(message),
      stack: config.isProduction ? undefined : err.stack,
      error: config.isProduction ? undefined : (err instanceof Error ? err.message : err)
    });
  } catch (jsonErr) {
    console.error('[CRITICAL] Error handler failed to send JSON:', jsonErr);
    res.status(500).send(`{"success":false,"message":"Critical error in error handler"}`);
  }
};
