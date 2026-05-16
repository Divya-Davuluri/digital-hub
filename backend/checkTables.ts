import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
    console.log('Tables in DB:', tables.rows.map(r => r.name));
    process.exit(0);
  } catch (err) {
    console.error('Error checking tables:', err);
    process.exit(1);
  }
}

checkTables();
