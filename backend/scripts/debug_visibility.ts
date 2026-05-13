import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function check() {
  console.log('--- CAMPAIGNS ---');
  const campaigns = await db.run(sql`SELECT id, name, tenant_id, workspace_id, client_id FROM campaigns`);
  console.table(campaigns.rows);

  console.log('\n--- USERS ---');
  const users = await db.run(sql`SELECT id, email, role, tenant_id, workspace_id FROM users`);
  console.table(users.rows);

  console.log('\n--- WORKSPACES ---');
  const workspaces = await db.run(sql`SELECT id, name, tenant_id FROM workspaces`);
  console.table(workspaces.rows);
}

check().catch(console.error);
