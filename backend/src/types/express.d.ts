import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: 'admin' | 'team' | 'client';
      tenantId: string;
      workspaceId?: string | null;
      twoFactorEnabled?: boolean;
    }
    interface Request {
      user?: User;
      tenantId?: string;
    }
  }
}
