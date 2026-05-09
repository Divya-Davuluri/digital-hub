import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function fix() {
  console.log('🛠️ Manually applying schema updates...');

  try {
    console.log('Adding onboarding_step to users...');
    await db.run(sql`ALTER TABLE users ADD COLUMN onboarding_step TEXT DEFAULT 'start'`);
    console.log('✅ Added onboarding_step');
  } catch (e: any) {
    console.log('⚠️ onboarding_step note:', e.message);
  }

  try {
    console.log('Adding first_login to users...');
    await db.run(sql`ALTER TABLE users ADD COLUMN first_login INTEGER DEFAULT 1`);
    console.log('✅ Added first_login');
  } catch (e: any) {
    console.log('⚠️ first_login note:', e.message);
  }

  console.log('🚀 Manual schema fix completed.');
}

fix().catch(console.error);
