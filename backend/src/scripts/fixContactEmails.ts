import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fixContactEmails() {
  try {
    console.log('Altering contact_emails schema...');
    
    // Add columns
    try { await db.run(sql`ALTER TABLE contact_emails ADD COLUMN tenant_id TEXT;`); } catch (e: any) { console.log('tenant_id might exist', e.message); }
    try { await db.run(sql`ALTER TABLE contact_emails ADD COLUMN workspace_id TEXT;`); } catch (e: any) { console.log('workspace_id might exist', e.message); }
    try { await db.run(sql`ALTER TABLE contact_emails ADD COLUMN open_count INTEGER DEFAULT 0;`); } catch (e: any) { console.log('open_count might exist', e.message); }
    try { await db.run(sql`ALTER TABLE contact_emails ADD COLUMN click_count INTEGER DEFAULT 0;`); } catch (e: any) { console.log('click_count might exist', e.message); }
    
    console.log('Backfilling tenant_id and workspace_id from contacts...');
    
    // Backfill from contacts
    await db.run(sql`
      UPDATE contact_emails 
      SET 
        tenant_id = (SELECT tenant_id FROM contacts WHERE contacts.id = contact_emails.contact_id),
        workspace_id = (SELECT workspace_id FROM contacts WHERE contacts.id = contact_emails.contact_id)
      WHERE tenant_id IS NULL OR workspace_id IS NULL;
    `);

    console.log('Schema update and backfill completed successfully');
  } catch (error) {
    console.error('Failed to update schema', error);
  }
}

fixContactEmails();
