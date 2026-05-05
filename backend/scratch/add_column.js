const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function runMigration() {
  let client;
  if (dbUrl && dbToken && dbToken !== 'your_token_here') {
    client = createClient({
      url: dbUrl.replace(/['"]/g, '').trim(),
      authToken: dbToken.replace(/['"]/g, '').trim(),
    });
  } else {
    client = createClient({
      url: `file:${path.join(process.cwd(), 'local.db')}`,
    });
  }

  try {
    console.log('Running physical migration to add last_login_at...');
    await client.execute('ALTER TABLE users ADD COLUMN last_login_at TEXT;');
    console.log('Success: Column added.');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column already exists.');
    } else {
      console.error('Migration failed:', err);
    }
  }
}

runMigration();
