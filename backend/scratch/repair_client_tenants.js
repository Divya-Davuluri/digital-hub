const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function repairClientTenants() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const adminRes = await client.execute("SELECT tenant_id FROM users WHERE role = 'admin' LIMIT 1;");
    const correctTenantId = adminRes.rows[0]?.tenant_id;

    if (correctTenantId) {
      console.log(`Syncing all clients to tenant: ${correctTenantId}`);
      const res = await client.execute(`UPDATE clients SET tenant_id = '${correctTenantId}';`);
      console.log(`Updated ${res.rowsAffected} clients.`);
    }
  } catch (err) {
    console.error('Client repair failed:', err);
  }
}

repairClientTenants();
