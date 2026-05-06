const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function consolidateData() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const NEW_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';
    console.log('--- CONSOLIDATING DATA TO TENANT:', NEW_TENANT_ID, '---');

    // Part 5: Create tasks table if missing
    console.log('Ensuring tasks table exists...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        client_name TEXT,
        priority TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'PENDING',
        due_date TEXT,
        assigned_to TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT
      );
    `);

    // Part 1: Fix tables
    const tables = ['tasks', 'campaigns', 'clients', 'projects', 'workspaces'];
    for (const table of tables) {
      const res = await client.execute(`UPDATE ${table} SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id != '${NEW_TENANT_ID}' OR tenant_id IS NULL;`);
      console.log(`Updated ${table}: ${res.rowsAffected} rows.`);
    }

    // Fix users (except admins)
    const userRes = await client.execute(`UPDATE users SET tenant_id = '${NEW_TENANT_ID}' WHERE (tenant_id != '${NEW_TENANT_ID}' OR tenant_id IS NULL) AND role != 'admin';`);
    console.log(`Updated users: ${userRes.rowsAffected} rows.`);

    console.log('\n--- VERIFICATION ---');
    const verifyTables = ['tasks', 'campaigns', 'clients'];
    for (const table of verifyTables) {
      const vRes = await client.execute(`SELECT tenant_id, COUNT(*) as count FROM ${table} GROUP BY tenant_id;`);
      console.log(`${table} distribution:`, vRes.rows);
    }

  } catch (err) {
    console.error('Consolidation failed:', err);
  }
}

consolidateData();
