import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🚀 STARTING TASKS TABLE MIGRATION...');

  try {
    // 1. Create table if not exists
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        title TEXT NOT NULL,
        client_name TEXT,
        priority TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'PENDING',
        due_date TEXT,
        assigned_to TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT
      )
    `);
    console.log('✅ Table creation check done.');

    // 2. Add columns if missing (SQLite ALTER TABLE ADD COLUMN doesn't support IF NOT EXISTS in all versions, so we use try/catch)
    const columns = [
      'tenant_id TEXT',
      'assigned_to TEXT',
      'created_by TEXT',
      'completed_at TEXT'
    ];

    for (const col of columns) {
      const colName = col.split(' ')[0];
      try {
        await db.run(sql.raw(`ALTER TABLE tasks ADD COLUMN ${col}`));
        console.log(`✅ Column added: ${colName}`);
      } catch (e: any) {
        if (e.message.includes('duplicate column name')) {
          console.log(`ℹ️ Column already exists: ${colName}`);
        } else {
          console.warn(`⚠️ Error adding column ${colName}:`, e.message);
        }
      }
    }

    // 3. Update NULL tenant IDs
    await db.run(sql`
      UPDATE tasks
      SET tenant_id = '9142f583-09e6-4df9-b4a2-bcab048799b5'
      WHERE tenant_id IS NULL 
      OR tenant_id = ''
    `);
    console.log('✅ Tenant ID synchronization done.');

    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ MIGRATION FAILED:', err.message);
    process.exit(1);
  }
}

runMigration();
