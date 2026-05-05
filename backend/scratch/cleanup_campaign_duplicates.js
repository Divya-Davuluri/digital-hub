const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

async function cleanupDuplicates() {
  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log('--- CAMPAIGN DEDUPLICATION ---');
    
    // Identify duplicates
    const checkRes = await client.execute(`
      SELECT name, tenant_id, COUNT(*) as count 
      FROM campaigns 
      GROUP BY name, tenant_id
      HAVING COUNT(*) > 1;
    `);
    
    console.log('Duplicates found:', checkRes.rows);

    if (checkRes.rows.length > 0) {
      console.log('Removing duplicate campaigns (keeping most recent)...');
      
      // Delete campaigns that are NOT the most recent (MAX(id) if ID is lexicographical or MAX(rowid))
      // Since ID is UUID, let's use MAX(created_at) or just a standard subquery approach
      const delRes = await client.execute(`
        DELETE FROM campaigns 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY name, tenant_id 
              ORDER BY created_at DESC, id DESC
            ) as rn
            FROM campaigns
          ) WHERE rn = 1
        );
      `);
      
      console.log(`Duplicates removed: ${delRes.rowsAffected || 0}`);
    }

    console.log('\n--- VERIFY PROJECTS ---');
    const projectRes = await client.execute(`
      SELECT id, name, client_name, created_at 
      FROM projects 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    console.log('Most recent projects:', projectRes.rows);

    console.log('\nCleanup complete.');
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
}

cleanupDuplicates();
