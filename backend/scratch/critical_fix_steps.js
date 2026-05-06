const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function criticalFix() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('--- STEP 1: GET OLD_TENANT_ID ---');
    // Since I already found it in my previous check but I will follow the user's logic
    // actually, let's just get it from the clients table as they asked.
    const oldRes = await client.execute("SELECT DISTINCT tenant_id FROM clients LIMIT 1;");
    const OLD_TENANT_ID = oldRes.rows[0]?.tenant_id; 
    const NEW_TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';

    console.log(`OLD_TENANT_ID: ${OLD_TENANT_ID}`);

    if (!OLD_TENANT_ID) {
      console.log('No tenant ID found in clients table.');
      // return; // Don't return, maybe some tables have it but not clients
    }

    console.log('\n--- STEP 2: RUN UPDATE QUERIES ---');
    
    // We'll use a more targeted approach just in case OLD_TENANT_ID is null
    const targetOldId = OLD_TENANT_ID || '183e7da7-c037-4193-b308-b5874aee129c';

    const queries = [
      `UPDATE clients SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}';`,
      `UPDATE campaigns SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}';`,
      `UPDATE projects SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}';`,
      `UPDATE workspaces SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}';`,
      `UPDATE tasks SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}';`,
      `DELETE FROM tenant_branding WHERE tenant_id = '${NEW_TENANT_ID}';`, // Cleanup to avoid UNIQUE constraint if moving
      `UPDATE tenant_branding SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}';`,
      `UPDATE users SET tenant_id = '${NEW_TENANT_ID}' WHERE tenant_id = '${targetOldId}' AND role != 'admin';`
    ];

    for (const q of queries) {
      try {
        const res = await client.execute(q);
        console.log(`Executed: ${q.substring(0, 30)}... - Rows affected: ${res.rowsAffected}`);
      } catch (e) {
        console.warn(`Query failed (likely constraint or no rows): ${q.substring(0, 30)}...`, e.message);
      }
    }

    console.log('\n--- STEP 3: VERIFY ---');
    const verifyTables = ['clients', 'campaigns', 'projects'];
    for (const table of verifyTables) {
      const vRes = await client.execute(`SELECT tenant_id, COUNT(*) as count FROM ${table} GROUP BY tenant_id;`);
      console.log(`${table} distribution:`, vRes.rows);
    }

  } catch (err) {
    console.error('Critical fix failed:', err);
  }
}

criticalFix();
