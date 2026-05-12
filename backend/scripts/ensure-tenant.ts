import { db } from '../src/db';
import { tenants } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const DEFAULT_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';

async function ensureDefaultTenant() {
  const t = await db.query.tenants.findFirst({
    where: eq(tenants.id, DEFAULT_TENANT_ID)
  });

  if (!t) {
    console.log("Default tenant missing! Creating it now...");
    await db.insert(tenants).values({
      id: DEFAULT_TENANT_ID,
      name: 'Default Agency',
      subdomain: 'default',
    });
    console.log("Created default tenant!");
  } else {
    console.log("Default tenant already exists.");
  }
  process.exit(0);
}

ensureDefaultTenant();
