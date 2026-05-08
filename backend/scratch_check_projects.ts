
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkProjectsTable() {
  try {
    const info = await db.all(sql`PRAGMA table_info(projects)`);
    console.log('Projects Table Info:', JSON.stringify(info, null, 2));
  } catch (err) {
    console.error('Error info:', err);
  }
}

checkProjectsTable();
