
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function listTables() {
  try {
    const tables = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table'`);
    console.log('Tables:', JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error('Error listing tables:', err);
  }
}

listTables();
