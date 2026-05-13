import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
  const c = await db.run(sql`SELECT id, name, tenant_id, workspace_id FROM campaigns`);
  console.table(c.rows);
}
run().catch(console.error);
