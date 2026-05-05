const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function runMigration() {
  let client;
  if (dbUrl && dbToken && dbToken !== 'your_token_here') {
    client = createClient({
      url: dbUrl.replace(/['"]/g, '').trim(),
      authToken: dbToken.replace(/['"]/g, '').trim(),
    });
  } else {
    client = createClient({
      url: `file:${path.join(process.cwd(), 'local.db')}`,
    });
  }

  try {
    console.log('Ensuring tasks table exists...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        client_name TEXT,
        client_id TEXT,
        priority TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'PENDING',
        due_date TEXT,
        assigned_to TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT
      );
    `);
    console.log('Success: Table ensured.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
