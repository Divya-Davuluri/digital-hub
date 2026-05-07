import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to detect tenant from subdomain or query params
 */
export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const host = req.headers.host || '';
  const parts = host.split('.');
  
  // 1. Try to get subdomain from host
  let subdomain = parts.length > 1 ? parts[0] : null;

  // 2. Fallback to query param for local dev
  const queryTenant = req.query.tenant as string;
  if (!subdomain || subdomain === 'localhost' || subdomain === '127') {
    if (queryTenant) {
       subdomain = queryTenant;
    }
  }

  if (subdomain && subdomain !== 'www') {
    try {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.subdomain, subdomain)
      });

      if (tenant) {
        req.tenantId = tenant.id;
        console.log(`🌐 TENANT DETECTED: ${tenant.name} (${tenant.id}) via subdomain: ${subdomain}`);
      }
    } catch (err) {
      console.error('Error detecting tenant from subdomain:', err);
    }
  }

  next();
};
