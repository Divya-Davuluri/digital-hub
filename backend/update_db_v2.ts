import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Updating reports table...');
  try {
    await db.run(sql`ALTER TABLE reports ADD COLUMN period TEXT`);
    await db.run(sql`ALTER TABLE reports ADD COLUMN spend INTEGER DEFAULT 0`);
    await db.run(sql`ALTER TABLE reports ADD COLUMN conversions INTEGER DEFAULT 0`);
    await db.run(sql`ALTER TABLE reports ADD COLUMN roas INTEGER DEFAULT 0`);
    console.log('✅ Reports table updated.');
  } catch (err) {
    console.log('⚠️ Reports table update skipped (columns might exist).');
  }

  console.log('Updating analytics table...');
  try {
    await db.run(sql`ALTER TABLE analytics ADD COLUMN total_spend INTEGER DEFAULT 0`);
    await db.run(sql`ALTER TABLE analytics ADD COLUMN roas INTEGER DEFAULT 0`);
    console.log('✅ Analytics table updated.');
  } catch (err) {
    console.log('⚠️ Analytics table update skipped (columns might exist).');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
