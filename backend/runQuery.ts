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
    console.log("Running SQLite safe migration queries...");

    // Add triggered_count
    try {
      await client.execute(`
        ALTER TABLE dm_automations ADD COLUMN triggered_count INTEGER DEFAULT 0;
      `);
      console.log("✓ Added triggered_count column");
    } catch (e: any) {
      console.log("triggered_count column might already exist:", e.message);
    }

    // Add replied_count
    try {
      await client.execute(`
        ALTER TABLE dm_automations ADD COLUMN replied_count INTEGER DEFAULT 0;
      `);
      console.log("✓ Added replied_count column");
    } catch (e: any) {
      console.log("replied_count column might already exist:", e.message);
    }

    // Add converted_count
    try {
      await client.execute(`
        ALTER TABLE dm_automations ADD COLUMN converted_count INTEGER DEFAULT 0;
      `);
      console.log("✓ Added converted_count column");
    } catch (e: any) {
      console.log("converted_count column might already exist:", e.message);
    }

    // Add conversion_rate
    try {
      await client.execute(`
        ALTER TABLE dm_automations ADD COLUMN conversion_rate REAL DEFAULT 0;
      `);
      console.log("✓ Added conversion_rate column");
    } catch (e: any) {
      console.log("conversion_rate column might already exist:", e.message);
    }

    // Verify columns on dm_automations
    const res = await client.execute(`
      PRAGMA table_info(dm_automations);
    `);
    console.log("dm_automations table structure:");
    console.table(res.rows.map(r => ({ name: r.name, type: r.type, dflt_value: r.dflt_value })));

  } catch (err: any) {
    console.error("❌ safe migration failed:", err);
  }
}

main();
