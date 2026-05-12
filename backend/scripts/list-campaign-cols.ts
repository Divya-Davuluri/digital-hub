import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function check() {
  const res = await db.run(sql.raw(`PRAGMA table_info(campaigns);`));
  console.log(res.rows.map(r => r.name).join(', '));
}

check().catch(console.error);
