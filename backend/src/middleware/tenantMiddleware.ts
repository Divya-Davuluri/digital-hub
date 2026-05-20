import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tenants, customDomains } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to detect tenant from subdomain, custom domain, or query params
 */
export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const host = req.headers.host || '';

  // 1. Try custom domain matching first
  if (host && host !== 'localhost:3000' && host !== 'localhost:5000' && host !== 'localhost:8000') {
    try {
      const customDom = await db.query.customDomains.findFirst({
        where: eq(customDomains.domain, host)
      });
      if (customDom) {
        (req as any).tenantId = customDom.tenantId;
        console.log(`🌐 CUSTOM DOMAIN DETECTED: Tenant ${customDom.tenantId} via domain: ${host}`);
        return next();
      }
    } catch (err) {
      console.error('Error detecting tenant from custom domain:', err);
    }
  }

  const parts = host.split('.');
  
  // 2. Try to get subdomain from host
  let subdomain = parts.length > 1 ? parts[0] : null;

  // 3. Fallback to query param for local dev
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
        (req as any).tenantId = tenant.id;
        console.log(`🌐 TENANT DETECTED: ${tenant.name} (${tenant.id}) via subdomain: ${subdomain}`);
      }
    } catch (err) {
      console.error('Error detecting tenant from subdomain:', err);
    }
  }

  next();
};
