import { db } from '../db';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function fixData() {
  const allWorkspaces = await db.all(sql`SELECT * FROM workspaces`);
  console.log(`FOUND ${allWorkspaces.length} WORKSPACES`);

  if (allWorkspaces.length === 0) {
    console.log('📦 No workspaces found. Creating a default one for the main tenant...');
    const tenantId = '9142f583-09e6-4df9-b4a2-bcab048799b5'; // From previous logs
    const workspaceId = uuidv4();

    await db.run(sql`
      INSERT INTO workspaces (id, tenant_id, name, slug)
      VALUES (${workspaceId}, ${tenantId}, 'Main Workspace', 'main')
    `);

    console.log(`✅ Default workspace created: ${workspaceId}`);

    console.log('🔄 Linking all users to this workspace...');
    await db.run(sql`
      UPDATE users SET workspace_id = ${workspaceId} WHERE tenant_id = ${tenantId}
    `);
    console.log('✅ Users linked.');
  } else {
    const workspaceId = (allWorkspaces as any)[0].id;
    console.log(`🔄 Linking users to existing workspace: ${workspaceId}`);
    await db.run(sql`
      UPDATE users SET workspace_id = ${workspaceId} WHERE workspace_id IS NULL
    `);
    console.log('✅ Users linked.');
  }

  process.exit(0);
}

fixData().catch(e => {
  console.error(e);
  process.exit(1);
});
