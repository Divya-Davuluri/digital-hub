const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function checkClientData() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('--- CHECKING CLIENT USER (Sravani) ---');
    const userRes = await client.execute("SELECT id, name, email, role, tenant_id, client_id FROM users WHERE name LIKE '%Sravani%' OR email LIKE '%Sravani%';");
    console.log('User Details:', userRes.rows);

    const sravaniClientId = userRes.rows[0]?.client_id;
    const sravaniTenantId = userRes.rows[0]?.tenant_id;

    console.log('\n--- CHECKING CLIENTS TABLE ---');
    const clientTableRes = await client.execute(`SELECT id, name, tenant_id FROM clients WHERE id = '${sravaniClientId}' OR name LIKE '%Sravani%';`);
    console.log('Client Table Entry:', clientTableRes.rows);

    console.log('\n--- CHECKING CAMPAIGNS ---');
    const campaignRes = await client.execute("SELECT id, name, client_id, tenant_id, status FROM campaigns LIMIT 10;");
    console.log('Campaign Samples:', campaignRes.rows);

    if (sravaniClientId) {
      const linkedCampaigns = await client.execute(`SELECT id, name, status FROM campaigns WHERE client_id = '${sravaniClientId}';`);
      console.log(`Campaigns linked to Sravani (${sravaniClientId}):`, linkedCampaigns.rows.length);
    }

  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkClientData();
