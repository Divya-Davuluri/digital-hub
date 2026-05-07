import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  const result = await db.all(sql`PRAGMA table_info(tasks)`);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

checkSchema();
