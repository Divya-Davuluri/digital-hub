import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🚀 STARTING COMPREHENSIVE SCHEMA FIX...');

  const tables = [
    {
      name: 'tasks',
      columns: [
        { name: 'tenant_id', type: 'TEXT' },
        { name: 'client_name', type: 'TEXT' },
        { name: 'priority', type: 'TEXT' },
        { name: 'status', type: 'TEXT' },
        { name: 'due_date', type: 'TEXT' },
        { name: 'assigned_to', type: 'TEXT' },
        { name: 'created_by', type: 'TEXT' },
        { name: 'created_at', type: 'TEXT' },
        { name: 'completed_at', type: 'TEXT' }
      ]
    },
    {
      name: 'campaigns',
      columns: [
        { name: 'tenant_id', type: 'TEXT' },
        { name: 'client_name', type: 'TEXT' },
        { name: 'status', type: 'TEXT' },
        { name: 'budget', type: 'REAL' },
        { name: 'spent', type: 'REAL' },
        { name: 'platform', type: 'TEXT' },
        { name: 'created_by', type: 'TEXT' },
        { name: 'created_at', type: 'TEXT' }
      ]
    },
    {
      name: 'clients',
      columns: [
        { name: 'tenant_id', type: 'TEXT' },
        { name: 'assigned_team_member_id', type: 'TEXT' },
        { name: 'company_name', type: 'TEXT' },
        { name: 'status', type: 'TEXT' }
      ]
    }
  ];

  for (const table of tables) {
    console.log(`\n📦 Checking table: ${table.name}`);
    try {
      const tableInfo: any = await db.all(sql.raw(`PRAGMA table_info(${table.name})`));
      const existingColumns = tableInfo.map((c: any) => c.name);

      for (const col of table.columns) {
        if (!existingColumns.includes(col.name)) {
          console.log(`➕ Adding column: ${col.name} to ${table.name}`);
          await db.run(sql.raw(`ALTER TABLE ${table.name} ADD COLUMN ${col.name} ${col.type}`));
        } else {
          console.log(`ℹ️ Column ${col.name} exists in ${table.name}`);
        }
      }
    } catch (e: any) {
      console.error(`❌ Error processing table ${table.name}:`, e.message);
    }
  }

  console.log('\n🎉 ALL SCHEMA FIXES COMPLETED!');
  process.exit(0);
}

runMigration();
