import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fixTenantNames() {
  console.log('Fixing tenant names...');
  try {
    await db.run(sql`
      UPDATE tenants 
      SET name = 'Digital Marketing Hub' 
      WHERE name = '' OR name IS NULL;
    `);
    console.log('✅ Tenant names fixed!');
    
    const tenantsList = await db.run(sql`SELECT id, name FROM tenants;`);
    console.log('Current tenants:', tenantsList);
  } catch (err) {
    console.error('Failed to fix tenant names:', err);
  }
  process.exit(0);
}

fixTenantNames();
