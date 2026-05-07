import { db } from '../db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const result = await db.all(sql`PRAGMA table_info(workspaces)`);
    console.log('WORKSPACES COLUMNS:');
    console.log(JSON.stringify(result, null, 2));
    
    const tenantsResult = await db.all(sql`SELECT * FROM tenants`);
    console.log('TENANTS:');
    console.log(JSON.stringify(tenantsResult, null, 2));

    const usersResult = await db.all(sql`SELECT email, role, tenant_id, workspace_id FROM users`);
    console.log('USERS:');
    console.log(JSON.stringify(usersResult, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

check();
