const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function checkProject() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const id = '626d80e6-d9aa-4747-85af-e98e6b76c7d4';
    console.log(`Checking project ID: ${id}`);
    const res = await client.execute(`SELECT * FROM projects WHERE id = '${id}';`);
    console.log('Project Data:', JSON.stringify(res.rows, null, 2));
    
    const tenantRes = await client.execute("SELECT tenant_id FROM users WHERE role = 'admin' LIMIT 1;");
    console.log('Admin Tenant ID:', tenantRes.rows[0]?.tenant_id);
  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkProject();
