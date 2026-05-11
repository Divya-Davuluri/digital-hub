import { db } from './src/db';
import { clients, tenants } from './src/db/schema';

async function main() {
  const allTenants = await db.select().from(tenants);
  console.log('--- ALL TENANTS ---');
  console.log(JSON.stringify(allTenants, null, 2));

  const allClients = await db.select().from(clients);
  console.log('--- ALL CLIENTS ---');
  console.log(JSON.stringify(allClients, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
