const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function checkTable() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('PRAGMA table_info(projects):');
    const result = await client.execute('PRAGMA table_info(projects);');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkTable();
