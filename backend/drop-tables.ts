import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function dropAll() {
  console.log('Dropping all tables...');
  
  const tables = [
    'report_requests',
    'reports',
    'campaigns',
    'analytics',
    'tasks',
    'notifications',
    'backup_codes',
    'sessions',
    'reset_tokens',
    'projects',
    'tenant_branding',
    'clients',
    'users',
    'workspaces',
    'tenants'
  ];

  for (const table of tables) {
    try {
      await db.run(sql.raw(`DROP TABLE IF EXISTS ${table}`));
      console.log(`Dropped ${table}`);
    } catch (e) {
      console.log(`Failed to drop ${table}:`, e.message);
    }
  }

  console.log('Done.');
}

dropAll().catch(console.error);
