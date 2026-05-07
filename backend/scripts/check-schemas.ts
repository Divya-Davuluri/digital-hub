import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkAllSchemas() {
  console.log('--- TASKS ---');
  console.log(JSON.stringify(await db.all(sql`PRAGMA table_info(tasks)`), null, 2));
  console.log('--- CAMPAIGNS ---');
  console.log(JSON.stringify(await db.all(sql`PRAGMA table_info(campaigns)`), null, 2));
  console.log('--- CLIENTS ---');
  console.log(JSON.stringify(await db.all(sql`PRAGMA table_info(clients)`), null, 2));
  process.exit(0);
}

checkAllSchemas();
