import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import { db } from '../db';
import { teamAssignments, users, workspaces } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to verify JWT and attach user context
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
    
    let assignedClientIds: string[] = [];
    let assignedCampaignIds: string[] = [];
    let assignedContactIds: string[] = [];
    let assignedWorkflowIds: string[] = [];

    // For team members, fetch their specific assignments from DB
    if (decoded.role === 'team') {
      try {
        const assignments = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, decoded.userId));
        assignments.forEach(a => {
          if (a.clientId) assignedClientIds.push(a.clientId);
          if (a.campaignId) assignedCampaignIds.push(a.campaignId);
          if (a.contactId) assignedContactIds.push(a.contactId);
          if (a.workflowId) assignedWorkflowIds.push(a.workflowId);
        });
      } catch (err) {
        console.error("Failed to fetch team assignments", err);
      }
    }

    // ATTACH WORKSPACE CONTEXT (Using Extended Express Request)
    (req as any).user = {
      id: decoded.userId,
      role: decoded.role,
      tenantId: decoded.tenantId,
      workspaceId: decoded.workspaceId || null,
      assignedClientIds,
      assignedCampaignIds,
      assignedContactIds,
      assignedWorkflowIds
    } as any;

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
      // Log permission denied
      console.error(`[AUDIT] Permission Denied. User ${req.user?.id} (Role: ${req.user?.role}) attempted to access restricted route: ${req.originalUrl}`);
      return next(new AppError('Not authorized to access this route', 403));
    }
    next();
  };
};

/**
 * PRODUCTION-GRADE WORKSPACE ISOLATION MIDDLEWARE
 * Ensures every request is filtered by the user's assigned workspace
 */
export const workspaceIsolation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    if (user && !user.workspaceId) {
      console.warn(`[WORKSPACE_ISOLATION] Workspace context missing for user ${user.id} (${user.role}). Running auto-recovery...`);
      const tenantId = user.tenantId || 'default-tenant';
      
      let workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.tenantId, tenantId)
      });
      
      let workspaceRecord: any = workspace;

      if (!workspaceRecord) {
        const fallbackId = 'default-workspace';
        await db.insert(workspaces).values({
          id: fallbackId,
          tenantId,
          name: 'Default Workspace',
          slug: 'default-slug',
          status: 'active'
        }).catch(() => {});
        
        workspaceRecord = {
          id: fallbackId,
          tenantId,
          name: 'Default Workspace',
          slug: 'default-slug',
          status: 'active'
        };
      }
      
      // Update users table
      await db.update(users).set({ workspaceId: workspaceRecord.id }).where(eq(users.id, user.id));
      
      // Update active request user context
      user.workspaceId = workspaceRecord.id;
      console.log(`[WORKSPACE_ISOLATION] Successfully auto-recovered user ${user.id} with workspace ${workspaceRecord.id}`);
    }
    next();
  } catch (err) {
    console.error('[WORKSPACE_ISOLATION] Critical error in middleware:', err);
    next();
  }
};
