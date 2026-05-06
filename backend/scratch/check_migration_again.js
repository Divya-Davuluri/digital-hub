const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function checkMigrationState() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const OLD_TENANT_ID = '183e7da7-c037-4193-b308-b5874aee129c';
    const NEW_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';

    console.log('--- MIGRATION STATE CHECK ---');
    
    const tables = ['clients', 'campaigns', 'projects', 'workspaces', 'tasks', 'tenant_branding', 'users'];
    
    for (const table of tables) {
      const res = await client.execute(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = '${OLD_TENANT_ID}';`);
      console.log(`${table} with OLD_TENANT_ID: ${res.rows[0].count}`);
    }

    console.log('\n--- NEW TENANT STATS ---');
    for (const table of ['clients', 'campaigns', 'projects']) {
      const res = await client.execute(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = '${NEW_TENANT_ID}';`);
      console.log(`${table} with NEW_TENANT_ID: ${res.rows[0].count}`);
    }

  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkMigrationState();
