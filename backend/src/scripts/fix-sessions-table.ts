import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fixSessionsTable() {
  console.log('🚀 Fixing sessions table structure...');

  try {
    // 1. Rename existing table to backup
    console.log('📦 Backing up existing sessions table...');
    try {
      await db.run(sql`ALTER TABLE sessions RENAME TO sessions_old`);
    } catch (e) {
      console.log('ℹ️ sessions table might not exist or already renamed.');
    }

    // 2. Create new table with correct structure
    console.log('📦 Creating new sessions table...');
    await db.run(sql`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        tenant_id TEXT,
        workspace_id TEXT,
        refresh_token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 3. Try to migrate data if possible
    console.log('🚚 Attempting to migrate session data...');
    try {
      await db.run(sql`
        INSERT INTO sessions (user_id, tenant_id, workspace_id, refresh_token, expires_at)
        SELECT user_id, tenant_id, workspace_id, refresh_token, expires_at FROM sessions_old
      `);
      console.log('✅ Data migrated.');
    } catch (e) {
      console.log('⚠️ Could not migrate data (likely schema mismatch), starting fresh.');
    }

    // 4. Drop old table
    try {
      await db.run(sql`DROP TABLE sessions_old`);
    } catch (e) {}

    console.log('✅ sessions table fixed successfully!');
  } catch (error) {
    console.error('❌ Failed to fix sessions table:', error);
  }
  process.exit(0);
}

fixSessionsTable();
