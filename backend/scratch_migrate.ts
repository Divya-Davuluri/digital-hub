
import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Link clients to workspaces if they are linked in the reverse way
    console.log('Linking clients to workspaces...');
    await db.run(sql`
      UPDATE clients 
      SET workspace_id = (SELECT id FROM workspaces WHERE workspaces.client_id = clients.id)
      WHERE workspace_id IS NULL 
      AND id IN (SELECT client_id FROM workspaces)
    `);

    // 2. Add missing columns to workspaces table
    const workspaceInfo = await db.all(sql`PRAGMA table_info(workspaces)`);
    const columnNames = workspaceInfo.map((c: any) => c.name);

    if (!columnNames.includes('name')) {
      console.log('Adding "name" column to workspaces...');
      await db.run(sql`ALTER TABLE workspaces ADD COLUMN name TEXT`);
      // Populate name from client_name
      await db.run(sql`UPDATE workspaces SET name = client_name WHERE name IS NULL`);
    }

    if (!columnNames.includes('slug')) {
      console.log('Adding "slug" column to workspaces...');
      await db.run(sql`ALTER TABLE workspaces ADD COLUMN slug TEXT`);
      // Populate slug from client_name
      await db.run(sql`UPDATE workspaces SET slug = lower(replace(client_name, ' ', '-')) WHERE slug IS NULL`);
    }

    if (!columnNames.includes('primary_color')) {
      console.log('Adding "primary_color" column to workspaces...');
      await db.run(sql`ALTER TABLE workspaces ADD COLUMN primary_color TEXT`);
      await db.run(sql`UPDATE workspaces SET primary_color = '#4f46e5' WHERE primary_color IS NULL`);
    }

    if (!columnNames.includes('updated_at')) {
      console.log('Adding "updated_at" column to workspaces...');
      await db.run(sql`ALTER TABLE workspaces ADD COLUMN updated_at TEXT`);
      await db.run(sql`UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();
