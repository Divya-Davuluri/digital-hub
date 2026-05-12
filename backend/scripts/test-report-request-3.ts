import { db } from '../src/db';
import { requestCustomReport } from '../src/controllers/reportController';
import { users, tenants } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  const t = await db.select().from(tenants).limit(1);
  if (!t.length) {
    console.log("No tenants");
    return;
  }
  const realTenantId = t[0].id;

  const req: any = {
    user: {
      id: uuidv4(), // Dummy user
      tenantId: realTenantId,
      workspaceId: null, // No workspace
      role: 'client'
    },
    body: {
      reportType: 'MONTHLY_PERFORMANCE'
    }
  };

  const res: any = {
    status: (code: number) => {
      console.log('Status:', code);
      return res;
    },
    json: (data: any) => {
      console.log('JSON:', data);
    }
  };

  await requestCustomReport(req, res);
  process.exit(0);
}

test();
