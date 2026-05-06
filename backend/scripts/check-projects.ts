import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const result = await db.run(sql`SELECT id, tenant_id FROM projects`);
    console.log('Projects in DB:', JSON.stringify(result.rows, null, 2));
    
    // Also check current users to see tenant IDs
    const users = await db.run(sql`SELECT id, email, tenant_id, role FROM users`);
    console.log('Users in DB:', JSON.stringify(users.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

check().then(() => process.exit(0));
