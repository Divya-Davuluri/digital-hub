import { db } from '../src/db';
import { sql } from 'drizzle-orm';

const TENANT_ID = '9142f583-09e6-4df9-b4a2-bcab048799b5';

async function main() {
  console.log('🚀 Starting Complete Database Fix...');

  try {
    // STEP 1 - Fix tenant_id on all campaigns
    console.log('STEP 1: Fixing tenant_id on campaigns...');
    await db.run(sql`
      UPDATE campaigns
      SET tenant_id = ${TENANT_ID}
      WHERE tenant_id IS NULL
        OR tenant_id = '';
    `);
    console.log('✅ STEP 1 complete.');

    // STEP 2 - Add sample performance data
    console.log('STEP 2: Adding sample performance data to campaigns...');
    await db.run(sql`
      UPDATE campaigns
      SET 
        impressions = CASE 
          WHEN name LIKE '%Spring%' THEN 125000
          WHEN name LIKE '%Eco%' THEN 98000
          WHEN name LIKE '%Cloud%' THEN 210000
          ELSE ABS(RANDOM() % 50000) + 10000 
        END,
        clicks = CASE
          WHEN name LIKE '%Spring%' THEN 3400
          WHEN name LIKE '%Eco%' THEN 2800
          WHEN name LIKE '%Cloud%' THEN 5600
          ELSE ABS(RANDOM() % 3000) + 500 
        END,
        conversions = CASE
          WHEN name LIKE '%Spring%' THEN 89
          WHEN name LIKE '%Eco%' THEN 120
          WHEN name LIKE '%Cloud%' THEN 45
          ELSE ABS(RANDOM() % 100) + 10 
        END,
        spent = CASE
          WHEN name LIKE '%Spring%' THEN 2340
          WHEN name LIKE '%Eco%' THEN 1890
          WHEN name LIKE '%Cloud%' THEN 7200
          ELSE ABS(RANDOM() % 3000) + 500 
        END
      WHERE tenant_id = ${TENANT_ID};
    `);
    console.log('✅ STEP 2 complete.');

    // STEP 3 - Verify campaigns have data
    console.log('STEP 3: Verifying campaign data...');
    const campaigns = await db.run(sql`
      SELECT id, name, tenant_id, 
        impressions, clicks, conversions, 
        spent, status
      FROM campaigns
      WHERE tenant_id = ${TENANT_ID};
    `);
    console.table(campaigns.rows);

    // STEP 4 - Create analytics table
    console.log('STEP 4: Recreating analytics table with correct schema...');
    await db.run(sql`DROP TABLE IF EXISTS analytics;`);
    await db.run(sql`
      CREATE TABLE analytics (
        id TEXT PRIMARY KEY
          DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL,
        campaign_id TEXT,
        date TEXT NOT NULL,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        spent REAL DEFAULT 0,
        revenue REAL DEFAULT 0,
        roas REAL DEFAULT 0,
        ctr REAL DEFAULT 0,
        cpc REAL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    console.log('Seeding analytics data...');
    const seedAnalytics = [
      ['2026-05-01', 45000, 1200, 38, 1500, 5700, 3.8],
      ['2026-05-02', 52000, 1450, 42, 1800, 6300, 3.5],
      ['2026-05-03', 48000, 1320, 35, 1600, 5250, 3.3],
      ['2026-05-04', 61000, 1680, 51, 2100, 7650, 3.6],
      ['2026-05-05', 58000, 1590, 48, 1950, 7200, 3.7],
      ['2026-05-06', 71000, 1920, 62, 2400, 9300, 3.9],
      ['2026-05-07', 65000, 1750, 55, 2200, 8250, 3.75]
    ];

    for (const row of seedAnalytics) {
      await db.run(sql`
        INSERT INTO analytics (
          tenant_id, date,
          impressions, clicks, conversions,
          spent, revenue, roas
        ) VALUES (
          ${TENANT_ID},
          ${row[0] as string},
          ${row[1] as number},
          ${row[2] as number},
          ${row[3] as number},
          ${row[4] as number},
          ${row[5] as number},
          ${row[6] as number}
        );
      `);
    }
    console.log('✅ STEP 4 complete.');

    // ADDITIONAL STEP: Create creative_assets table
    console.log('STEP 5: Creating creative_assets table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS creative_assets (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        workspace_id TEXT,
        tenant_id TEXT,
        uploaded_by TEXT,
        name TEXT NOT NULL,
        file_name TEXT,
        file_url TEXT NOT NULL,
        file_type TEXT,
        mime_type TEXT,
        size INTEGER,
        category TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    console.log('✅ STEP 5 complete.');

    console.log('🎉 All database fixes applied successfully!');
  } catch (err: any) {
    console.error('❌ Error applying database fixes:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
