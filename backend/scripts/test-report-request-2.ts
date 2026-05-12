import { db } from '../src/db';
import { requestCustomReport } from '../src/controllers/reportController';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  const req: any = {
    user: {
      id: uuidv4(), // Dummy user
      tenantId: '9142f583-09e6-4df9-b4a2-bcab048799b5', // Default tenant
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
