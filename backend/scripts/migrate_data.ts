import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrateData() {
  console.log('--- MIGRATING DATA ---');
  
  // 1. Copy 'name' to 'report_name' where report_name is null
  try {
    await db.run(sql.raw(`UPDATE reports SET report_name = name WHERE report_name IS NULL`));
    console.log('✅ Data copied from name to report_name.');
  } catch (err: any) {
    console.error('❌ Error copying name:', err.message);
  }

  // 2. Copy 'pdf_url' to 'file_url' where file_url is null
  try {
    await db.run(sql.raw(`UPDATE reports SET file_url = pdf_url WHERE file_url IS NULL`));
    console.log('✅ Data copied from pdf_url to file_url.');
  } catch (err: any) {
    console.error('❌ Error copying file_url:', err.message);
  }

  console.log('--- DATA MIGRATION FINISHED ---');
}

migrateData().catch(console.error);
