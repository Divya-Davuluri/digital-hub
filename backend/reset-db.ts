import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function resetDB() {
  console.log('Resetting database...');
  
  const tables = [
    'campaigns',
    'clients',
    'workspaces',
    'report_requests',
    'reports',
    'tasks',
    'notifications',
    'users',
    'tenants'
  ];

  for (const table of tables) {
    try {
      await db.run(sql.raw(`DELETE FROM ${table}`));
      console.log(`Cleared ${table}`);
    } catch (e) {
      console.log(`Table ${table} might not exist or failed to clear:`, e.message);
    }
  }

  console.log('Database reset complete.');
}

resetDB().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
