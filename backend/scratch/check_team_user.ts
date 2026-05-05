import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkUser() {
  try {
    const user = await db.run(sql`
      SELECT id, name, email, role, password, tenant_id FROM users 
      WHERE email = 'team@demo.com'
    `);
    console.log('User check result:', JSON.stringify(user, null, 2));
    
    const admin = await db.run(sql`
      SELECT tenant_id FROM users 
      WHERE role = 'admin' LIMIT 1
    `);
    console.log('Admin check result:', JSON.stringify(admin, null, 2));
  } catch (err) {
    console.error('Error checking user:', err);
  }
}

checkUser();
