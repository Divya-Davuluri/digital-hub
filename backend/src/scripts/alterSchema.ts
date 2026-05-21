import { db } from '../db';
import { sql } from 'drizzle-orm';

async function alterSchema() {
  try {
    console.log('Altering schema...');
    
    // Add columns to short_links
    try { await db.run(sql`ALTER TABLE short_links ADD COLUMN password TEXT;`); } catch (e: any) { console.log('Column password might already exist', e.message); }
    try { await db.run(sql`ALTER TABLE short_links ADD COLUMN scheduled_at TEXT;`); } catch (e: any) { console.log('Column scheduled_at might already exist', e.message); }
    
    // Add columns to link_clicks
    try { await db.run(sql`ALTER TABLE link_clicks ADD COLUMN utm_source TEXT;`); } catch (e: any) { console.log('Column utm_source might already exist', e.message); }
    try { await db.run(sql`ALTER TABLE link_clicks ADD COLUMN utm_medium TEXT;`); } catch (e: any) { console.log('Column utm_medium might already exist', e.message); }
    try { await db.run(sql`ALTER TABLE link_clicks ADD COLUMN utm_campaign TEXT;`); } catch (e: any) { console.log('Column utm_campaign might already exist', e.message); }

    
    console.log('Schema updated successfully');
  } catch (error) {
    console.error('Failed to update schema', error);
  }
}

alterSchema();
