
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function runUpdates() {
  try {
    console.log('Updating tenant_branding...');
    await db.run(sql`UPDATE tenant_branding SET secondary_color = '#10b981' WHERE secondary_color IS NULL OR secondary_color = '' OR secondary_color = '#000000'`);
    await db.run(sql`UPDATE tenant_branding SET primary_color = '#4f46e5' WHERE primary_color IS NULL OR primary_color = ''`);
    console.log('Update complete.');
  } catch (err) {
    console.error('Update failed:', err);
  }
}

runUpdates();
