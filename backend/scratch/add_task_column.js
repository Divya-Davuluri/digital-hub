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
    console.log('Ensuring tasks table has completed_at column...');
    try {
      await client.execute('ALTER TABLE tasks ADD COLUMN completed_at TEXT;');
      console.log('Success: Column added.');
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Column already exists.');
      } else {
        console.error('Error adding column:', e.message);
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
