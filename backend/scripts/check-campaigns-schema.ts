import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function check() {
  console.log('🔍 Checking Campaigns Table Schema...');
  const res = await db.run(sql.raw(`PRAGMA table_info(campaigns);`));
  console.log(JSON.stringify(res.rows, null, 2));
}

check().catch(console.error);
