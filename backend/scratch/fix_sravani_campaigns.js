const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function fixSravaniData() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('--- FIXING SRAVANI USER AND CAMPAIGNS ---');
    
    const sravaniClientId = 'fd704101-ba76-48b9-b898-f2f7c6208399';
    const anjuTenantId = '9142f583-09e6-4df9-b4a2-bcab048799b5';

    // 1. Update User Sravani
    console.log('Updating user Sravani...');
    const userUpdate = await client.execute(`
      UPDATE users 
      SET client_id = '${sravaniClientId}', 
          tenant_id = '${anjuTenantId}'
      WHERE name LIKE '%Sravani%' OR email LIKE '%Sravani%';
    `);
    console.log(`Users affected: ${userUpdate.rowsAffected}`);

    // 2. Link Campaigns to Sravani
    console.log('Linking all active campaigns to Sravani...');
    const campaignUpdate = await client.execute(`
      UPDATE campaigns 
      SET client_id = '${sravaniClientId}',
          tenant_id = '${anjuTenantId}'
      WHERE status = 'active' OR status = 'Active';
    `);
    console.log(`Campaigns affected: ${campaignUpdate.rowsAffected}`);

    console.log('Fix complete!');
  } catch (err) {
    console.error('Fix failed:', err);
  }
}

fixSravaniData();
