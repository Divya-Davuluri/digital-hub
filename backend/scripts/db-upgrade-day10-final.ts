import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Running Comprehensive Day 10 Migration...');
  
  const columns = [
    { table: 'campaigns', name: 'spent', type: 'REAL DEFAULT 0' },
    { table: 'campaigns', name: 'budget', type: 'REAL DEFAULT 0' },
    { table: 'campaigns', name: 'platform', type: 'TEXT DEFAULT "Meta"' },
    { table: 'campaigns', name: 'client_id', type: 'TEXT' },
    { table: 'campaigns', name: 'workspace_id', type: 'TEXT' },
    { table: 'campaigns', name: 'headline', type: 'TEXT' },
    { table: 'campaigns', name: 'cta', type: 'TEXT' },
    { table: 'campaigns', name: 'creative_url', type: 'TEXT' },
    { table: 'campaigns', name: 'assigned_team_member_id', type: 'TEXT' },
    { table: 'campaigns', name: 'ctr', type: 'REAL DEFAULT 0' },
    { table: 'campaigns', name: 'updated_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' }
  ];

  for (const col of columns) {
    try {
      await db.run(sql.raw(`ALTER TABLE ${col.table} ADD COLUMN ${col.name} ${col.type};`));
      console.log(`✅ Added ${col.name} to ${col.table}`);
    } catch (err: any) {
      if (err.message?.includes('duplicate column name')) {
        console.log(`ℹ️ Column ${col.name} already exists in ${col.table}, skipping.`);
      } else {
        console.error(`❌ Error adding ${col.name} to ${col.table}:`, err.message);
      }
    }
  }

  console.log('✨ Migration Complete!');
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
