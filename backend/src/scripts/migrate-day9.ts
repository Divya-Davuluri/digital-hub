import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrateDay9() {
  console.log('🚀 STARTING DAY 9 MIGRATION: Budget Pool Automation & AI Forecasting');

  try {
    // 1. Create budget_pools table
    console.log('--- Creating budget_pools table ---');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS budget_pools (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        total_budget REAL NOT NULL,
        spent REAL DEFAULT 0,
        remaining REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create automation_rules table
    console.log('--- Creating automation_rules table ---');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        name TEXT NOT NULL,
        trigger_metric TEXT NOT NULL,
        operator TEXT NOT NULL,
        threshold REAL NOT NULL,
        action TEXT NOT NULL,
        action_value REAL,
        is_active INTEGER DEFAULT 1,
        last_run_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create spending_forecasts table
    console.log('--- Creating spending_forecasts table ---');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS spending_forecasts (
        id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL,
        forecast_date TEXT NOT NULL,
        predicted_spend REAL NOT NULL,
        confidence_interval REAL DEFAULT 0.95,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ DAY 9 MIGRATION COMPLETED SUCCESSFULLY');
  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error);
    process.exit(1);
  }
}

migrateDay9();
