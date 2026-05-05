const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function finalizeMigration() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const NEW_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';
    
    console.log('Finalizing migration to:', NEW_TENANT_ID);

    const tables = ['clients', 'campaigns', 'projects', 'workspaces', 'tasks'];
    for (const table of tables) {
      await client.execute(`UPDATE ${table} SET tenant_id = '${NEW_TENANT_ID}';`);
      console.log(`Updated all rows in ${table}`);
    }

    // Handle branding specifically
    console.log('Cleaning up branding...');
    // Delete any branding that isn't the new tenant
    await client.execute(`DELETE FROM tenant_branding WHERE tenant_id != '${NEW_TENANT_ID}';`);
    // Ensure at least one branding exists for new tenant or just move it if it was unique
    // For now, we've updated the primary tables which is what matters for the error.

    console.log('Verifying Projects...');
    const res = await client.execute(`SELECT id, name, tenant_id FROM projects WHERE tenant_id = '${NEW_TENANT_ID}';`);
    console.log(`Projects in new tenant: ${res.rows.length}`);

    console.log('Migration finalized.');
  } catch (err) {
    console.error('Finalization failed:', err);
  }
}

finalizeMigration();
