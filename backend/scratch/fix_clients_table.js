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
    console.log('Ensuring clients table has required columns...');
    const columns = [
      'ALTER TABLE clients ADD COLUMN company_name TEXT;',
      'ALTER TABLE clients ADD COLUMN assigned_team_member_id TEXT;'
    ];

    for (const sql of columns) {
      try {
        await client.execute(sql);
        console.log(`Success: Executed ${sql}`);
      } catch (e) {
        if (e.message.includes('duplicate column name')) {
          console.log(`Column already exists: ${sql}`);
        } else {
          console.error(`Error executing ${sql}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
