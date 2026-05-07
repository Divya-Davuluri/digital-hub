import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
  clientId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;

  if (!token) {
    return next(new AppError('No token, authorization denied', 401));
  }

  try {
    const decoded: any = jwt.verify(token, config.jwtSecret);
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });

    if (!user) {
      return next(new AppError('User not found, authorization denied', 401));
    }

    req.user = user;
    req.tenantId = user.tenantId || undefined;
    req.clientId = user.clientId || undefined;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(new AppError('Token is not valid', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions', 403));
    }
    next();
  };
};
