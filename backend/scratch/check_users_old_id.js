const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function checkUsers() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    const res = await client.execute("SELECT email, role, tenant_id FROM users WHERE tenant_id = '183e7da7-c037-4193-b308-b5874aee129c';");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
