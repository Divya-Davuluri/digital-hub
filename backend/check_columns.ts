import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function check() {
  const r: any = await db.run(sql`PRAGMA table_info(users)`);
  console.log('Columns in users table:');
  r.rows.forEach((col: any) => console.log(`- ${col.name} (${col.type})`));
}

check().catch(console.error);
