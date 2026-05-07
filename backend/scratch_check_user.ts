
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkUser() {
  try {
    const users = await db.all(sql`SELECT name, email, tenant_id FROM users WHERE name LIKE '%anju%'`);
    console.log('User Info:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error checking user:', err);
  }
}

checkUser();
