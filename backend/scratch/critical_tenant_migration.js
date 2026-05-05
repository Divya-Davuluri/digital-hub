const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function migrateData() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('--- DATA MIGRATION ---');
    
    // Step 1: Get OLD_TENANT_ID
    const oldTenantRes = await client.execute("SELECT DISTINCT tenant_id FROM clients LIMIT 1;");
    const OLD_TENANT_ID = oldTenantRes.rows[0]?.tenant_id;
    const NEW_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';

    console.log(`OLD_TENANT_ID: ${OLD_TENANT_ID}`);
    console.log(`NEW_TENANT_ID: ${NEW_TENANT_ID}`);

    if (!OLD_TENANT_ID) {
      console.log('No old tenant ID found in clients table. Proceeding with general update...');
    }

    // Step 2: Run Updates
    const tables = [
      'clients', 'campaigns', 'projects', 'workspaces', 'tasks', 'tenant_branding'
    ];

    for (const table of tables) {
      console.log(`Updating ${table}...`);
      const res = await client.execute(`
        UPDATE ${table} 
        SET tenant_id = '${NEW_TENANT_ID}' 
        WHERE tenant_id = '${OLD_TENANT_ID}' OR tenant_id IS NULL OR tenant_id = '';
      `);
      console.log(`${table} rows affected: ${res.rowsAffected}`);
    }

    // Update users (except admin)
    console.log('Updating users...');
    const userRes = await client.execute(`
      UPDATE users 
      SET tenant_id = '${NEW_TENANT_ID}' 
      WHERE (tenant_id = '${OLD_TENANT_ID}' OR tenant_id IS NULL OR tenant_id = '') 
      AND role != 'admin';
    `);
    console.log(`Users rows affected: ${userRes.rowsAffected}`);

    console.log('\n--- VERIFICATION ---');
    const verifyTables = ['clients', 'campaigns', 'projects'];
    for (const table of verifyTables) {
      const vRes = await client.execute(`SELECT tenant_id, COUNT(*) as count FROM ${table} GROUP BY tenant_id;`);
      console.log(`${table} distribution:`, vRes.rows);
    }

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateData();
