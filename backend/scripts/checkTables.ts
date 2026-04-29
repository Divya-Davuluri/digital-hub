import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
    console.log("Existing Tables:", result);
  } catch (error) {
    console.error("Error fetching tables:", error);
  }
}

checkTables();
