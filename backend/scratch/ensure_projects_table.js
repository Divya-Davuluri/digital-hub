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
    console.log('Checking projects table...');
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects';");
    
    if (result.rows.length === 0) {
      console.log('Creating projects table...');
      await client.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          client_id TEXT,
          target_date TEXT,
          status TEXT DEFAULT 'Planning',
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
      console.log('Table created.');
    } else {
      console.log('Table exists. Ensuring columns...');
      // Simple way to add columns if missing
      try { await client.execute('ALTER TABLE projects ADD COLUMN client_id TEXT;'); } catch(e) {}
      try { await client.execute('ALTER TABLE projects ADD COLUMN target_date TEXT;'); } catch(e) {}
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
