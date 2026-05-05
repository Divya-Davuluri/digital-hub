import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Running migration: ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TEXT;');
    await db.run(sql`ALTER TABLE users ADD COLUMN last_login_at TEXT;`).catch(e => {
        if (e.message.includes('duplicate column name')) {
            console.log('Column last_login_at already exists.');
        } else {
            throw e;
        }
    });
    console.log('Migration successful or column already exists.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
