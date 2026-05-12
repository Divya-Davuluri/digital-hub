import { db } from '../db';
import { sql } from 'drizzle-orm';

async function upgrade() {
  console.log('🚀 Starting Day 10 Campaign Schema Upgrade...');
  
  const queries = [
    `ALTER TABLE campaigns ADD COLUMN headline TEXT;`,
    `ALTER TABLE campaigns ADD COLUMN cta TEXT;`,
    `ALTER TABLE campaigns ADD COLUMN creative_url TEXT;`,
    `ALTER TABLE campaigns ADD COLUMN ctr REAL DEFAULT 0;`,
    `ALTER TABLE campaigns ADD COLUMN updated_at TEXT;`,
    // Ensure workspace_id is not strictly required if we want orphans for admin overview
    // Note: SQLite doesn't support DROP NOT NULL easily, but we can try to make it work
  ];

  for (const query of queries) {
    try {
      await db.run(sql.raw(query));
      console.log(`✅ Executed: ${query}`);
    } catch (e: any) {
      if (e.message.includes('duplicate column name')) {
        console.log(`⏭️ Column already exists, skipping: ${query}`);
      } else {
        console.error(`❌ Error executing ${query}:`, e.message);
      }
    }
  }

  console.log('🎉 Schema upgrade complete!');
}

upgrade().catch(console.error);
