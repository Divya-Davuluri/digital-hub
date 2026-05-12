import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function sync() {
  console.log('🔄 Syncing Campaign Data to New Schema...');
  
  try {
    // 1. Sync spend -> spent
    await db.run(sql.raw(`UPDATE campaigns SET spent = spend WHERE spent = 0 AND spend > 0;`));
    console.log('✅ Synced spend to spent');

    // 2. Sync clientId -> client_id
    await db.run(sql.raw(`UPDATE campaigns SET client_id = clientId WHERE client_id IS NULL AND clientId IS NOT NULL;`));
    console.log('✅ Synced clientId to client_id');

    // 3. Sync workspaceId -> workspace_id
    await db.run(sql.raw(`UPDATE campaigns SET workspace_id = workspaceId WHERE workspace_id IS NULL AND workspaceId IS NOT NULL;`));
    console.log('✅ Synced workspaceId to workspace_id');

    // 4. Sync creativeUrl -> creative_url
    await db.run(sql.raw(`UPDATE campaigns SET creative_url = creativeUrl WHERE creative_url IS NULL AND creativeUrl IS NOT NULL;`));
    console.log('✅ Synced creativeUrl to creative_url');

    console.log('✨ Data synchronization complete!');
  } catch (err: any) {
    console.error('❌ Data sync failed:', err.message);
  }
}

sync().then(() => process.exit(0)).catch(() => process.exit(1));
