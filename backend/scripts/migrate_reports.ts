import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('--- STARTING COMPREHENSIVE REPORTS MIGRATION ---');
  
  // 1. Ensure columns exist in reports table
  // We use snake_case because we are running raw SQL ALTER TABLE commands
  const columnsToAdd = [
    { name: 'name', type: 'TEXT' },
    { name: 'report_name', type: 'TEXT' },
    { name: 'client_name', type: 'TEXT' },
    { name: 'campaign', type: 'TEXT DEFAULT "All Campaigns"' },
    { name: 'type', type: 'TEXT DEFAULT "PERFORMANCE"' },
    { name: 'period', type: 'TEXT DEFAULT "Last 30 Days"' },
    { name: 'start_date', type: 'TEXT' },
    { name: 'end_date', type: 'TEXT' },
    { name: 'status', type: 'TEXT DEFAULT "completed"' },
    { name: 'total_spend', type: 'REAL DEFAULT 0' },
    { name: 'impressions', type: 'INTEGER DEFAULT 0' },
    { name: 'clicks', type: 'INTEGER DEFAULT 0' },
    { name: 'conversions', type: 'INTEGER DEFAULT 0' },
    { name: 'roas', type: 'REAL DEFAULT 0' },
    { name: 'file_url', type: 'TEXT' },
    { name: 'requested_by', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      console.log(`Checking/Adding column ${col.name}...`);
      await db.run(sql.raw(`ALTER TABLE reports ADD COLUMN ${col.name} ${col.type}`));
      console.log(`✅ Column ${col.name} added.`);
    } catch (err: any) {
      if (err.message.includes('duplicate column name')) {
        console.log(`ℹ️ Column ${col.name} already exists.`);
      } else {
        console.error(`❌ Error adding column ${col.name}:`, err.message);
      }
    }
  }

  // 2. Data consistency fix: ensure report_name is populated if name exists
  try {
    await db.run(sql`UPDATE reports SET report_name = name WHERE report_name IS NULL AND name IS NOT NULL`);
    console.log('✅ Data synchronized between name and report_name.');
  } catch (err: any) {
    console.log('ℹ️ Sync skip or failed:', err.message);
  }
  
  console.log('--- MIGRATION FINISHED ---');
}

migrate().catch(console.error);
