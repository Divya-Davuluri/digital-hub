import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fix() {
  console.log('--- Creating Missing Tables ---');
  
  const createTables = [
    `CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      client_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      media_type TEXT,
      platforms TEXT NOT NULL,
      scheduled_at TEXT,
      published_at TEXT,
      status TEXT DEFAULT 'draft',
      approved_by TEXT,
      rejected_reason TEXT,
      hashtags TEXT,
      first_comment TEXT,
      best_time_score REAL DEFAULT 0,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS content_library (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      media_url TEXT,
      tags TEXT,
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS touchpoints (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      client_id TEXT,
      session_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      campaign_id TEXT,
      touchpoint_type TEXT NOT NULL,
      revenue REAL DEFAULT 0,
      spend REAL DEFAULT 0,
      position INTEGER DEFAULT 0,
      occurred_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS attribution_results (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      client_id TEXT,
      channel TEXT NOT NULL,
      model TEXT NOT NULL,
      attributed_revenue REAL DEFAULT 0,
      attributed_conversions REAL DEFAULT 0,
      spend REAL DEFAULT 0,
      roas REAL DEFAULT 0,
      credit_percentage REAL DEFAULT 0,
      period TEXT DEFAULT 'Last 30 Days',
      calculated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      workspace_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`
  ];

  for (const query of createTables) {
    try {
      await db.run(sql.raw(query));
      console.log('Executed query successfully');
    } catch (e) {
      console.error('Error executing query:', (e as any).message);
    }
  }

  console.log('--- Fix Complete ---');
  process.exit(0);
}
fix();
