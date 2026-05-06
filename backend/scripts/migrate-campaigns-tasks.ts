import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Running DB migrations...');
  try {
    const queries = [
      `ALTER TABLE campaigns ADD COLUMN spent REAL DEFAULT 0;`,
      `ALTER TABLE campaigns ADD COLUMN impressions INTEGER DEFAULT 0;`,
      `ALTER TABLE campaigns ADD COLUMN clicks INTEGER DEFAULT 0;`,
      `ALTER TABLE campaigns ADD COLUMN conversions INTEGER DEFAULT 0;`,
      `ALTER TABLE campaigns ADD COLUMN start_date TEXT;`,
      `ALTER TABLE campaigns ADD COLUMN budget REAL DEFAULT 0;`,
      `ALTER TABLE campaigns ADD COLUMN created_by TEXT;`,
      `ALTER TABLE campaigns ADD COLUMN tenant_id TEXT;`,
      `ALTER TABLE tasks ADD COLUMN tenant_id TEXT;`,
      `ALTER TABLE tasks ADD COLUMN assigned_to TEXT;`,
      `ALTER TABLE tasks ADD COLUMN created_by TEXT;`,
      `ALTER TABLE tasks ADD COLUMN completed_at TEXT;`
    ];

    for (const q of queries) {
      try {
        await db.run(sql.raw(q));
        console.log(`Executed: ${q}`);
      } catch (err: any) {
        if (err.message && err.message.includes('duplicate column name')) {
          console.log(`Skipped (already exists): ${q}`);
        } else {
          console.error(`Error executing ${q}:`, err.message);
        }
      }
    }
    console.log('Migrations complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
