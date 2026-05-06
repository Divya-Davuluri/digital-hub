const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function forceUnifyTenants() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const NEW_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';
    console.log(`Forcing all tables to unify under tenant: ${NEW_TENANT_ID}`);

    const tables = ['clients', 'campaigns', 'projects', 'workspaces', 'tasks', 'tenant_branding'];
    
    for (const table of tables) {
      const res = await client.execute(`UPDATE ${table} SET tenant_id = '${NEW_TENANT_ID}';`);
      console.log(`Table ${table}: ${res.rowsAffected} rows synced.`);
    }

    // Sync users (except specific admin)
    const userRes = await client.execute(`UPDATE users SET tenant_id = '${NEW_TENANT_ID}' WHERE role != 'admin' OR email = 'anjuuser123@gmail.com';`);
    console.log(`Users table: ${userRes.rowsAffected} rows synced.`);

    console.log('\n--- VERIFICATION ---');
    for (const table of ['clients', 'campaigns', 'projects', 'users']) {
      const vRes = await client.execute(`SELECT tenant_id, role, COUNT(*) as count FROM ${table} GROUP BY tenant_id, role;`);
      console.table(vRes.rows);
    }

  } catch (err) {
    console.error('Unification failed:', err);
  }
}

forceUnifyTenants();
