import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating transactions table...');
  await db.run(sql`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('Table created or already exists.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
