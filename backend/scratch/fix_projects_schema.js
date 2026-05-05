const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function fixTable() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('Recreating projects table with correct schema...');
    
    // 1. Create the new table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS projects_new (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        title TEXT,
        client_id TEXT,
        client_name TEXT,
        target_date TEXT,
        due_date TEXT,
        status TEXT DEFAULT 'PLANNING',
        completion INTEGER DEFAULT 0,
        description TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // 2. Copy data if projects exists
    try {
      console.log('Attempting to migrate existing data...');
      // Try to map existing title to name if needed
      await client.execute(`
        INSERT OR IGNORE INTO projects_new (id, tenant_id, name, title, client_name, status, completion, due_date, created_by, created_at)
        SELECT id, tenant_id, COALESCE(title, 'Untitled'), title, client_name, status, completion, due_date, created_by, created_at
        FROM projects;
      `);
      console.log('Data migration successful.');
    } catch (e) {
      console.warn('Data migration failed (might be empty):', e.message);
    }

    // 3. Swap tables
    console.log('Swapping tables...');
    await client.execute('DROP TABLE IF EXISTS projects;');
    await client.execute('ALTER TABLE projects_new RENAME TO projects;');
    
    console.log('Schema fix complete!');
  } catch (err) {
    console.error('Fix failed:', err);
  }
}

fixTable();
