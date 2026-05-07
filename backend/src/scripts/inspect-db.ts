import { db } from '../db';
import { sql } from 'drizzle-orm';

async function listTables() {
  const result = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log(JSON.stringify(result, null, 2));
  
  for (const table of (result as any)) {
    console.log(`\n--- ${table.name} ---`);
    console.log(JSON.stringify(await db.all(sql`PRAGMA table_info(${sql.raw(table.name)})`), null, 2));
  }
  process.exit(0);
}

listTables();
