import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fixDatabase() {
  console.log('🔄 STARTING DATABASE FIX...');
  
  try {
    // 1. Update tenant_id for all campaigns
    console.log('📝 Updating campaign tenant IDs...');
    await db.run(sql`
      UPDATE campaigns
      SET tenant_id = '9142f583-09e6-4df9-b4a2-bcab048799b5'
      WHERE tenant_id IS NULL
      OR tenant_id = ''
      OR tenant_id != '9142f583-09e6-4df9-b4a2-bcab048799b5';
    `);

    // 2. Add missing columns
    console.log('🏗️ Adding missing columns to campaigns table...');
    
    const columns = [
      { name: 'spent', type: 'REAL DEFAULT 0' },
      { name: 'impressions', type: 'INTEGER DEFAULT 0' },
      { name: 'clicks', type: 'INTEGER DEFAULT 0' },
      { name: 'conversions', type: 'INTEGER DEFAULT 0' },
      { name: 'start_date', type: 'TEXT' },
      { name: 'end_date', type: 'TEXT' },
      { name: 'created_by', type: 'TEXT' }
    ];

    for (const col of columns) {
      try {
        console.log(`   - Adding ${col.name}...`);
        await db.run(sql.raw(`ALTER TABLE campaigns ADD COLUMN ${col.name} ${col.type}`));
      } catch (err: any) {
        if (err.message.includes('duplicate column name')) {
          console.log(`     (Column ${col.name} already exists, skipping)`);
        } else {
          console.warn(`     ⚠️ Warning adding ${col.name}: ${err.message}`);
        }
      }
    }

    console.log('✅ DATABASE FIX COMPLETED SUCCESSFULLY.');
  } catch (err: any) {
    console.error('❌ DATABASE FIX FAILED:', err.message);
    process.exit(1);
  }
}

fixDatabase();
