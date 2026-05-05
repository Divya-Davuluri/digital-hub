const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function runMigration() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('Updating campaigns table schema...');
    
    // Add missing columns if they don't exist
    try { await client.execute('ALTER TABLE campaigns ADD COLUMN client_name TEXT;'); } catch(e) {}
    try { await client.execute('ALTER TABLE campaigns ADD COLUMN assigned_team_member_id TEXT;'); } catch(e) {}
    try { await client.execute('ALTER TABLE campaigns ADD COLUMN platform TEXT;'); } catch(e) {}
    
    // Fix null tenant_id
    console.log('Fixing null tenant_id values...');
    await client.execute(`
      UPDATE campaigns 
      SET tenant_id = (
        SELECT tenant_id FROM users 
        WHERE role = 'admin' LIMIT 1
      )
      WHERE tenant_id IS NULL;
    `);

    // Backfill client_name from clients table
    console.log('Backfilling client_name...');
    await client.execute(`
      UPDATE campaigns
      SET client_name = (
        SELECT name FROM clients
        WHERE clients.id = campaigns.client_id
      )
      WHERE client_name IS NULL;
    `);

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
