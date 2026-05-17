import { db } from '../db';
import { sql } from 'drizzle-orm';

async function createDmTables() {
  console.log('--- Creating DM Automation Tables ---');

  const queries = [
    `CREATE TABLE IF NOT EXISTS dm_automations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      client_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      trigger_keyword TEXT,
      trigger_condition TEXT DEFAULT 'contains',
      reply_message TEXT NOT NULL,
      follow_up_messages TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      total_triggered INTEGER DEFAULT 0,
      total_replied INTEGER DEFAULT 0,
      total_converted INTEGER DEFAULT 0,
      instagram_account_id TEXT,
      post_id TEXT DEFAULT 'any',
      exclude_keywords TEXT DEFAULT '[]',
      daily_limit INTEGER DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS dm_sequences (
      id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      contact_username TEXT,
      current_step INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_message_at TEXT,
      next_message_at TEXT,
      converted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`
  ];

  for (const query of queries) {
    try {
      await db.run(sql.raw(query));
      console.log('Executed query successfully.');
    } catch (e: any) {
      console.error('Error executing query:', e.message);
    }
  }

  console.log('--- Setup Complete ---');
  process.exit(0);
}

createDmTables();
