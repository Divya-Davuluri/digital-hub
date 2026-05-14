import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('--- STARTING TENANTS BRANDING MIGRATION ---');
  
  const columnsToAdd = [
    { name: 'logo_url', type: 'TEXT' },
    { name: 'favicon_url', type: 'TEXT' },
    { name: 'primary_color', type: 'TEXT DEFAULT "#6366f1"' },
    { name: 'secondary_color', type: 'TEXT DEFAULT "#4f46e5"' },
    { name: 'support_email', type: 'TEXT' },
    { name: 'custom_css', type: 'TEXT' },
    { name: 'footer_text', type: 'TEXT' },
    { name: 'remove_powered_by', type: 'INTEGER DEFAULT 0' },
    { name: 'custom_domain', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      console.log(`Adding column ${col.name} to tenants...`);
      await db.run(sql.raw(`ALTER TABLE tenants ADD COLUMN ${col.name} ${col.type}`));
      console.log(`✅ Column ${col.name} added.`);
    } catch (err: any) {
      if (err.message.includes('duplicate column name')) {
        console.log(`ℹ️ Column ${col.name} already exists.`);
      } else {
        console.error(`❌ Error adding column ${col.name}:`, err.message);
      }
    }
  }

  console.log('--- MIGRATION FINISHED ---');
}

migrate().catch(console.error);
