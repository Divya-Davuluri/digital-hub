import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSeoTables() {
  console.log("Checking SEO tables...");
  const tables = ['seo_projects', 'seo_keywords', 'seo_audits', 'seo_briefs', 'seo_content_gaps'];
  
  for (const table of tables) {
    try {
      const res = await db.run(sql.raw(`PRAGMA table_info(${table})`));
      console.log(`\nTable: ${table}`);
      // res.rows is an array of objects/arrays containing column details
      if (res.rows && res.rows.length > 0) {
        res.rows.forEach((row: any) => {
          console.log(` - ${row.name || row[1]} (${row.type || row[2]})`);
        });
      } else {
        console.log(`❌ Table ${table} does not exist or has no columns.`);
      }
    } catch (err: any) {
      console.error(`Error checking ${table}:`, err.message);
    }
  }
  process.exit(0);
}

checkSeoTables();
