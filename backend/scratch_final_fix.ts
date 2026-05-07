
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function finalFix() {
  try {
    console.log('Finalizing data fixes...');
    await db.run(sql`UPDATE clients SET company_name = name WHERE company_name IS NULL OR company_name = ''`);
    console.log('Data fixed successfully.');
  } catch (err) {
    console.error('Fix failed:', err);
  }
}

finalFix();
