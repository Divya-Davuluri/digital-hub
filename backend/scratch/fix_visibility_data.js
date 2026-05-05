const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function fixData() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('--- FIX 1: CAMPAIGNS TENANT_ID ---');
    
    // Get a valid tenant_id from an admin user
    const adminRes = await client.execute("SELECT tenant_id FROM users WHERE role = 'admin' LIMIT 1;");
    const adminTenantId = adminRes.rows[0]?.tenant_id;

    if (adminTenantId) {
      console.log(`Setting NULL/empty tenant_id to ${adminTenantId} for campaigns...`);
      const res1 = await client.execute(`
        UPDATE campaigns 
        SET tenant_id = '${adminTenantId}'
        WHERE tenant_id IS NULL 
        OR tenant_id = '';
      `);
      console.log(`Campaigns updated: ${res1.rowsAffected || 0}`);
    } else {
      console.warn('No admin tenant_id found.');
    }

    console.log('\n--- FIX 2: PROJECTS CLIENT_NAME ---');
    
    // Backfill client_name from clients table
    console.log('Backfilling client_name for projects...');
    const res2 = await client.execute(`
      UPDATE projects 
      SET client_name = (
        SELECT name FROM clients 
        WHERE clients.id = projects.client_id
      )
      WHERE (client_name IS NULL OR client_name = '')
      AND client_id IS NOT NULL;
    `);
    console.log(`Projects updated: ${res2.rowsAffected || 0}`);

    console.log('\n--- VERIFICATION ---');
    const teamRes = await client.execute("SELECT tenant_id FROM users WHERE role = 'team' LIMIT 1;");
    const teamTenantId = teamRes.rows[0]?.tenant_id;
    
    const campRes = await client.execute("SELECT tenant_id, name FROM campaigns LIMIT 5;");
    
    console.log('Team Tenant ID:', teamTenantId);
    console.log('Sample Campaigns Tenants:', campRes.rows);

    if (teamTenantId && adminTenantId && teamTenantId !== adminTenantId) {
       console.log('MISMATCH DETECTED: Team and Admin tenants are different. Syncing campaigns to team tenant...');
       await client.execute(`UPDATE campaigns SET tenant_id = '${teamTenantId}';`);
    }

    console.log('\nData fix complete.');
  } catch (err) {
    console.error('Data fix failed:', err);
  }
}

fixData();
