import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function createTables() {
  console.log('🚀 Creating Link Management tables...');
  try {
    // Bio Pages
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS bio_pages (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        logo_url TEXT,
        background_type TEXT DEFAULT 'color',
        background_color TEXT DEFAULT '#6366f1',
        background_gradient TEXT,
        background_image TEXT,
        font_family TEXT DEFAULT 'Inter',
        button_style TEXT DEFAULT 'rounded',
        button_color TEXT DEFAULT '#ffffff',
        button_text_color TEXT DEFAULT '#000000',
        links TEXT NOT NULL DEFAULT '[]',
        total_clicks INTEGER DEFAULT 0,
        total_views INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Short Links
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS short_links (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        original_url TEXT NOT NULL,
        short_code TEXT NOT NULL UNIQUE,
        custom_alias TEXT,
        campaign_id TEXT,
        campaign_name TEXT,
        total_clicks INTEGER DEFAULT 0,
        unique_clicks INTEGER DEFAULT 0,
        qr_code_url TEXT,
        is_active INTEGER DEFAULT 1,
        expires_at TEXT,
        meta_pixel_id TEXT,
        tiktok_pixel_id TEXT,
        google_tag_id TEXT,
        click_data TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Link Clicks
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS link_clicks (
        id TEXT PRIMARY KEY,
        link_id TEXT NOT NULL,
        link_type TEXT NOT NULL,
        country TEXT,
        city TEXT,
        device TEXT,
        browser TEXT,
        os TEXT,
        referrer TEXT,
        ip_address TEXT,
        clicked_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    console.log('✅ Tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
}

createTables();
