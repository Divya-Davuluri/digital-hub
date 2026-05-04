import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function runMigration() {
  if (!dbUrl || !dbToken) {
    console.error('❌ Turso credentials missing');
    process.exit(1);
  }

  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  console.log('🚀 [MIGRATION] Creating projects table...');

  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PLANNING',
        completion INTEGER NOT NULL DEFAULT 0,
        due_date TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;

    await client.execute(sql);
    console.log('✨ [MIGRATION] SUCCESS: projects table created or already exists.');
    process.exit(0);
  } catch (err) {
    console.error('❌ [MIGRATION] FAILED:', err);
    process.exit(1);
  }
}

runMigration();
