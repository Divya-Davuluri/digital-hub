import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const columns = [
      "ALTER TABLE clients ADD COLUMN company_name TEXT;",
      "ALTER TABLE clients ADD COLUMN phone TEXT;",
      "ALTER TABLE clients ADD COLUMN plan TEXT DEFAULT 'STARTER';",
      "ALTER TABLE clients ADD COLUMN assigned_team_member_id TEXT;",
      "ALTER TABLE clients ADD COLUMN workspace_created_at TEXT;",
      "ALTER TABLE clients ADD COLUMN onboarding_status TEXT DEFAULT 'PENDING';"
    ];

    for (const col of columns) {
      try {
        await db.run(sql.raw(col));
        console.log('Executed:', col);
      } catch (err: any) {
        if (err.message && err.message.includes('duplicate column name')) {
          console.log('Column already exists, skipping:', col);
        } else {
          console.error('Error executing', col, err.message);
        }
      }
    }

    const createWorkspaces = `
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        plan TEXT DEFAULT 'STARTER',
        status TEXT DEFAULT 'ACTIVE',
        settings TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;
    await db.run(sql.raw(createWorkspaces));
    console.log('Workspaces table created successfully.');
  } catch (err) {
    console.error('Migration failed', err);
  }
}

run().then(() => process.exit(0));
