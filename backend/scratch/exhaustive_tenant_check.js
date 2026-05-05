const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function exhaustiveCheck() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const targetId = '1e3f1f68-f98e-4771-b22d-54705135a9f5';
    console.log(`--- CHECKING PROJECT: ${targetId} ---`);
    const projectRes = await client.execute(`SELECT id, name, tenant_id FROM projects WHERE id = '${targetId}';`);
    console.log('Project details:', projectRes.rows);

    console.log('\n--- UNIQUE PROJECT TENANTS ---');
    const projectTenants = await client.execute("SELECT DISTINCT tenant_id FROM projects;");
    console.log(projectTenants.rows);

    console.log('\n--- UNIQUE USER TENANTS ---');
    const userTenants = await client.execute("SELECT role, email, tenant_id FROM users WHERE role IN ('admin', 'team');");
    console.log(userTenants.rows);

  } catch (err) {
    console.error('Check failed:', err);
  }
}

exhaustiveCheck();
