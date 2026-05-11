import { db } from './src/db';
import { tenants } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // Update "Main Agency" subdomain to match Render host if needed
  // Or just create a new mapping.
  
  const result = await db.update(tenants)
    .set({ subdomain: 'digital-hub-1' })
    .where(eq(tenants.id, '43f37c83-fc75-477c-987d-bb22899561b8'))
    .returning();
    
  console.log('Updated Tenant:', JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
