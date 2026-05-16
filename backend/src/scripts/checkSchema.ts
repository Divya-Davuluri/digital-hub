import { db } from '../db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table';`);
    console.log('Tables:', JSON.stringify(tables.rows, null, 2));

    const analyticsColumns = await db.run(sql`PRAGMA table_info(analytics);`);
    console.log('Analytics Columns:', JSON.stringify(analyticsColumns.rows, null, 2));

    const brandingColumns = await db.run(sql`PRAGMA table_info(tenant_branding);`);
    console.log('Branding Columns:', JSON.stringify(brandingColumns.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
check();
