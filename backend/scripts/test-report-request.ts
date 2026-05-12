import { db } from '../src/db';
import { requestCustomReport } from '../src/controllers/reportController';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  const clientUser = await db.query.users.findFirst({
    where: eq(users.role, 'client')
  });

  if (!clientUser) {
    console.log("No client user found");
    process.exit(0);
  }

  const req: any = {
    user: {
      id: clientUser.id,
      tenantId: clientUser.tenantId,
      workspaceId: clientUser.workspaceId,
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
