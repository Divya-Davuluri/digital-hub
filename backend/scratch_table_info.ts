
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function tableInfo() {
  try {
    const info = await db.all(sql`PRAGMA table_info(tenant_branding)`);
    console.log('Tenant Branding Info:', JSON.stringify(info, null, 2));
  } catch (err) {
    console.error('Error info:', err);
  }
}

tableInfo();
