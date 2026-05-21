import { db } from '../db';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function backfillEmails() {
  try {
    console.log('Fetching email_sent activities...');
    const activities = await db.run(sql`
      SELECT id, tenant_id, workspace_id, contact_id, activity_message, created_at 
      FROM contact_activities 
      WHERE activity_type = 'email_sent'
    `);
    
    // Check how many emails exist
    const existingEmails = await db.run(sql`SELECT count(*) as count FROM contact_emails`);
    console.log('Existing emails:', existingEmails.rows[0].count);

    if (activities.rows.length === 0) {
      console.log('No activities found to backfill.');
      return;
    }

    let inserted = 0;
    for (const activity of activities.rows) {
      const msg = activity.activity_message || '';
      const subjectMatch = msg.toString().match(/Email sent: (.*)/);
      const subject = subjectMatch ? subjectMatch[1] : 'Message from HubSaaS';

      // Check if an email already exists for this contact around this time (within 1 minute)
      const existing = await db.run(sql`
        SELECT id FROM contact_emails 
        WHERE contact_id = ${activity.contact_id} 
        AND subject = ${subject}
      `);

      if (existing.rows.length === 0) {
        await db.run(sql`
          INSERT INTO contact_emails (
            id, tenant_id, workspace_id, contact_id, subject, body, status, provider, sent_at, open_count, click_count
          ) VALUES (
            ${uuidv4()}, ${activity.tenant_id}, ${activity.workspace_id}, ${activity.contact_id}, 
            ${subject}, 'Automated email body not recorded.', 'sent', 'resend', ${activity.created_at}, 0, 0
          )
        `);
        inserted++;
      }
    }

    console.log(`Successfully backfilled ${inserted} emails from activities.`);
  } catch (error) {
    console.error('Backfill error:', error);
  }
}

backfillEmails();
