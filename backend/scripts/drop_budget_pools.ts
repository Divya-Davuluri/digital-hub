import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.run(sql`DROP TABLE IF EXISTS budget_pools`);
    console.log('Successfully dropped budget_pools table');
  } catch (err) {
    console.error('Error dropping table:', err);
  }
}

main().catch(console.error);
