
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function fixSchema() {
  try {
    console.log('Fixing schema...');
    const workspaceInfo = await db.all(sql`PRAGMA table_info(workspaces)`);
    const columnNames = workspaceInfo.map((c: any) => c.name);

    if (!columnNames.includes('logo')) {
      console.log('Adding "logo" column to workspaces...');
      await db.run(sql`ALTER TABLE workspaces ADD COLUMN logo TEXT`);
    }

    console.log('Fixing campaigns workspace_id...');
    // Link old campaigns to the first workspace of their tenant
    await db.run(sql`
      UPDATE campaigns 
      SET workspace_id = (SELECT id FROM workspaces WHERE workspaces.tenant_id = campaigns.tenant_id LIMIT 1)
      WHERE workspace_id IS NULL
    `);

    console.log('Schema and data fix completed.');
  } catch (err) {
    console.error('Fix failed:', err);
  }
}

fixSchema();
