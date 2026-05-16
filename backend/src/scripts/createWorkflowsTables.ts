import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fix() {
  console.log('--- Creating Missing Tables ---');
  
  const createTables = [
    `CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      client_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      trigger_type TEXT DEFAULT 'form_submit',
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      enrolled_count INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      last_run_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS workflow_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      icon TEXT DEFAULT '⚡',
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      usage_count INTEGER DEFAULT 0,
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
