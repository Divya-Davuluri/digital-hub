import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function fixTenantIds() {
  const adminTenantId = '9142f583-09e6-4df9-b4a2-bcab048799b5';
  console.log(`🛠️ FIXING TENANT IDS -> ${adminTenantId}`);

  try {
    // Fix Tasks
    const tasksRes = await db.run(sql`
      UPDATE tasks
      SET tenant_id = ${adminTenantId}
      WHERE tenant_id IS NULL 
        OR tenant_id = ''
        OR tenant_id != ${adminTenantId}
    `);
    console.log(`✅ Tasks updated`);

    // Fix Campaigns
    const campaignsRes = await db.run(sql`
      UPDATE campaigns
      SET tenant_id = ${adminTenantId}
      WHERE tenant_id IS NULL
        OR tenant_id = ''
        OR tenant_id != ${adminTenantId}
    `);
    console.log(`✅ Campaigns updated`);

    // Fix Clients
    const clientsRes = await db.run(sql`
      UPDATE clients
      SET tenant_id = ${adminTenantId}
      WHERE tenant_id IS NULL
        OR tenant_id = ''
        OR tenant_id != ${adminTenantId}
    `);
    console.log(`✅ Clients updated`);

    console.log('🎉 DATABASE TENANT FIX COMPLETED SUCCESSFULLY');
  } catch (err) {
    console.error('❌ FAILED TO FIX TENANT IDS:', err);
    process.exit(1);
  }
}

fixTenantIds();
