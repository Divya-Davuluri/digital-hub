const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function globalSync() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('Performing global data sync to primary tenant...');
    
    // We'll sync EVERYTHING (campaigns, projects, clients) to the demo tenant 
    // to ensure the user sees all data consistently.
    const primaryTenantId = '183e7da7-c037-4193-b308-b5874aee129c';
    
    const queries = [
      `UPDATE projects SET tenant_id = '${primaryTenantId}';`,
      `UPDATE campaigns SET tenant_id = '${primaryTenantId}';`,
      `UPDATE clients SET tenant_id = '${primaryTenantId}';`,
      `UPDATE tasks SET tenant_id = '${primaryTenantId}';`
    ];

    for (const query of queries) {
      const res = await client.execute(query);
      console.log(`Executed: ${query.split(' ')[1]} table - Rows affected: ${res.rowsAffected}`);
    }

    console.log('Global sync complete!');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

globalSync();
