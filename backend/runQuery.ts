import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const dbToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !dbToken) {
    console.error("No Turso URL or token");
    process.exit(1);
  }

  const client = createClient({
    url: dbUrl.replace(/['"]/g, '').trim(),
    authToken: dbToken.replace(/['"]/g, '').trim(),
  });

  try {
    console.log("Running SQL queries...");

    // 1. Fix tenant name
    await client.execute(`
      UPDATE tenants 
      SET name = 'Digital Marketing Hub' 
      WHERE name = '' OR name IS NULL;
    `);
    console.log("✓ tenants name corrected");

    // 2. Clean duplicate SEO audit issues
    await client.execute(`
      DELETE FROM seo_audit_issues
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM seo_audit_issues
        GROUP BY tenant_id, url, issue_type
      );
    `);
    console.log("✓ seo_audit_issues duplicates cleaned");

    // 3. Clean duplicate campaigns
    await client.execute(`
      DELETE FROM campaigns
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM campaigns
        GROUP BY tenant_id, name
      );
    `);
    console.log("✓ campaigns duplicates cleaned");

    // 4. Verify all tables exist
    const res = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `);
    console.log("✓ SQLite tables present:");
    console.table(res.rows.map(r => r.name));

  } catch (err: any) {
    console.error("❌ SQL Query execution failed:", err);
  }
}

main();
