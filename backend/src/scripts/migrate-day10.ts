import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrateDay10() {
  console.log('🚀 STARTING DAY 10 MIGRATION: White-Labeling & Custom Domain Mapping');

  try {
    // 1. Create custom_branding table
    console.log('--- Creating custom_branding table ---');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS custom_branding (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL UNIQUE,
        agency_name TEXT,
        logo_url TEXT,
        favicon_url TEXT,
        primary_color TEXT DEFAULT '#6366f1',
        secondary_color TEXT DEFAULT '#4f46e5',
        custom_css TEXT,
        support_email TEXT,
        remove_powered_by INTEGER DEFAULT 0,
        footer_text TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create custom_domains table
    console.log('--- Creating custom_domains table ---');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS custom_domains (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        domain TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        is_verified INTEGER DEFAULT 0,
        ssl_status TEXT DEFAULT 'none',
        last_checked_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ DAY 10 MIGRATION COMPLETED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error);
    process.exit(1);
  }
}

migrateDay10();
