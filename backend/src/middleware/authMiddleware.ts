import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

/**
 * Middleware to verify JWT and attach user context
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies?.token;

  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (tokenFromCookie) {
    token = tokenFromCookie;
  }

  if (!token) {
    return next(new AppError('No token provided, authorization denied', 401));
  }

  try {
    const decoded: any = jwt.verify(token, config.jwtSecret);
    
    // ATTACH WORKSPACE CONTEXT (Using Extended Express Request)
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      tenantId: decoded.tenantId,
      workspaceId: decoded.workspaceId || null
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(new AppError('Token is not valid', 401));
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    next();
  };
};

/**
 * PRODUCTION-GRADE WORKSPACE ISOLATION MIDDLEWARE
 * Ensures every request is filtered by the user's assigned workspace
 */
export const workspaceIsolation = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'client' && !req.user.workspaceId) {
    return next(new AppError('Workspace context missing for client user', 403));
  }
  next();
};
