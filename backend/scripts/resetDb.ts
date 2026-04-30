import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function reset() {
  console.log('🗑️ Resetting Database...');
  
  const tables = [
    'analytics', 'backup_codes', 'tenant_branding', 'campaigns', 'clients', 
    'notifications', 'reset_tokens', 'sessions', 'tasks', 'users', 'tenants'
  ];

  for (const table of tables) {
    try {
      console.log(`Dropping table: ${table}`);
      await db.run(sql.raw(`DROP TABLE IF EXISTS ${table}`));
    } catch (e) {
      console.error(`Failed to drop ${table}:`, e);
    }
  }

  console.log('✅ Database reset complete!');
}

reset().catch(err => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
