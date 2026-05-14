import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('--- CUSTOM BRANDING ---');
  const b = await db.run(sql`SELECT * FROM custom_branding`);
  console.table(b.rows);

  console.log('\n--- CUSTOM DOMAINS ---');
  const d = await db.run(sql`SELECT * FROM custom_domains`);
  console.table(d.rows);
}
run().catch(console.error);
