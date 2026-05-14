import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('--- STARTING MANUAL MIGRATION ---');
  
  // 1. Add missing columns to reports table
  const columnsToAdd = [
    { name: 'client_id', type: 'TEXT' },
    { name: 'campaign_id', type: 'TEXT' },
    { name: 'total_spend', type: 'REAL DEFAULT 0' },
    { name: 'impressions', type: 'INTEGER DEFAULT 0' },
    { name: 'clicks', type: 'INTEGER DEFAULT 0' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'pdf_url', type: 'TEXT' },
    { name: 'requested_by', type: 'TEXT' },
    { name: 'start_date', type: 'TEXT' },
    { name: 'end_date', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      console.log(`Adding column ${col.name}...`);
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

  // 2. Handle renamed columns if any
  // 'url' was changed to 'pdf_url' in my previous turn, and 'spent' to 'total_spend'.
  // But wait, Drizzle might have created them fresh.
  
  console.log('--- MIGRATION FINISHED ---');
}

migrate().catch(console.error);
