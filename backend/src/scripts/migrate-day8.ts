import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Starting Day 8 Migration...');

  try {
    // 1. Create ad_groups table
    console.log('📦 Creating ad_groups table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS ad_groups (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        budget INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        targeting TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 2. Create creatives table
    console.log('📦 Creating creatives table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS creatives (
        id TEXT PRIMARY KEY,
        ad_group_id TEXT REFERENCES ad_groups(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'image',
        url TEXT NOT NULL,
        headline TEXT,
        description TEXT,
        call_to_action TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 3. Create campaign_templates table
    console.log('📦 Creating campaign_templates table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS campaign_templates (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        channel TEXT NOT NULL,
        objective TEXT,
        default_budget INTEGER,
        default_targeting TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 4. Create campaign_activity_logs table
    console.log('📦 Creating campaign_activity_logs table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS campaign_activity_logs (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    console.log('✅ Day 8 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Day 8 Migration failed:', error);
  }
  process.exit(0);
}

migrate();
