const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function repairTenants() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('Finding correct tenant ID...');
    const adminRes = await client.execute("SELECT tenant_id FROM users WHERE role = 'admin' LIMIT 1;");
    const correctTenantId = adminRes.rows[0]?.tenant_id;

    if (!correctTenantId) {
       // Fallback to team member if admin not found
       const teamRes = await client.execute("SELECT tenant_id FROM users WHERE role = 'team' LIMIT 1;");
       correctTenantId = teamRes.rows[0]?.tenant_id;
    }

    if (correctTenantId) {
      console.log(`Setting projects tenant_id to ${correctTenantId}...`);
      const res = await client.execute(`UPDATE projects SET tenant_id = '${correctTenantId}';`);
      console.log(`Updated ${res.rowsAffected} projects.`);
    } else {
      console.error('No valid tenant ID found in users table.');
    }
  } catch (err) {
    console.error('Repair failed:', err);
  }
}

repairTenants();
