import { db } from './src/db';
import { users, clients, workspaces, campaigns, transactions, analytics, reports, reportRequests } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const targetTenantId = '43f37c83-fc75-477c-987d-bb22899561b8';
  const sourceTenantId = '7de2010d-a20a-40e3-9580-b7cefdb0c73d';

  console.log('Moving admin user...');
  await db.update(users)
    .set({ tenantId: targetTenantId })
    .where(eq(users.email, 'admin@demo.com'));

  console.log('Moving clients...');
  await db.update(clients)
    .set({ tenantId: targetTenantId })
    .where(eq(clients.tenantId, sourceTenantId));

  console.log('Moving workspaces...');
  await db.update(workspaces)
    .set({ tenantId: targetTenantId })
    .where(eq(workspaces.tenantId, sourceTenantId));

  console.log('Moving campaigns...');
  await db.update(campaigns)
    .set({ tenantId: targetTenantId })
    .where(eq(campaigns.tenantId, sourceTenantId));

  console.log('Moving analytics...');
  await db.update(analytics)
    .set({ tenantId: targetTenantId })
    .where(eq(analytics.tenantId, sourceTenantId));

  console.log('Moving reports...');
  await db.update(reports)
    .set({ tenantId: targetTenantId })
    .where(eq(reports.tenantId, sourceTenantId));

  console.log('Moving report requests...');
  await db.update(reportRequests)
    .set({ tenantId: targetTenantId })
    .where(eq(reportRequests.tenantId, sourceTenantId));

  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
