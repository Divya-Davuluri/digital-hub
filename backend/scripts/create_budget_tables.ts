import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`budget_pools\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`tenant_id\` text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        \`workspace_id\` text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        \`client_id\` text REFERENCES clients(id) ON DELETE CASCADE,
        \`name\` text NOT NULL,
        \`total_budget\` real NOT NULL,
        \`allocated_budget\` real DEFAULT 0,
        \`remaining_budget\` real DEFAULT 0,
        \`currency\` text DEFAULT 'USD',
        \`period\` text DEFAULT 'monthly',
        \`start_date\` text,
        \`end_date\` text,
        \`auto_reallocate\` integer DEFAULT 1,
        \`status\` text DEFAULT 'active',
        \`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updated_at\` text DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS \`budget_allocations\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`pool_id\` text NOT NULL REFERENCES budget_pools(id) ON DELETE CASCADE,
        \`tenant_id\` text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        \`channel\` text NOT NULL,
        \`allocated_amount\` real DEFAULT 0,
        \`spent_amount\` real DEFAULT 0,
        \`remaining_amount\` real DEFAULT 0,
        \`clicks\` integer DEFAULT 0,
        \`impressions\` integer DEFAULT 0,
        \`conversions\` integer DEFAULT 0,
        \`revenue\` real DEFAULT 0,
        \`roas\` real DEFAULT 0,
        \`ctr\` real DEFAULT 0,
        \`cvr\` real DEFAULT 0,
        \`performance_score\` real DEFAULT 0,
        \`auto_adjust\` integer DEFAULT 1,
        \`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updated_at\` text DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

main().catch(console.error);
