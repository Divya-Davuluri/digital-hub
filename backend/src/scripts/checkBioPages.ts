import { db } from '../db';
import { bioPages } from '../db/schema';

async function main() {
  const pages = await db.select().from(bioPages);
  console.log('--- ALL BIO PAGES ---');
  pages.forEach(p => {
    console.log(`ID: ${p.id}, TenantID: ${p.tenantId}, Slug: ${p.slug}, Title: ${p.title}, Published: ${p.isPublished}`);
  });
  console.log('--- END ---');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
