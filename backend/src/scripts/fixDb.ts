import { db } from '../db';
import { sql } from 'drizzle-orm';

async function fix() {
  const tables = ['analytics', 'tenant_branding', 'budget_pools'];
  
  const addColumn = async (table: string, col: string, type: string) => {
    try {
      await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${col} ${type};`));
      console.log(`Added ${col} to ${table}`);
    } catch (e) {
      console.log(`${table}.${col} already exists or error: ${(e as any).message}`);
    }
  };

  console.log('--- Fixing Database Schema ---');
  
  // Analytics
  await addColumn('analytics', 'workspace_id', 'TEXT');
  await addColumn('analytics', 'campaign_id', 'TEXT');
  await addColumn('analytics', 'total_spent', 'REAL');
  await addColumn('analytics', 'roas', 'REAL');

  // Tenant Branding
  await addColumn('tenant_branding', 'agency_name', 'TEXT');
  await addColumn('tenant_branding', 'favicon_url', 'TEXT');
  await addColumn('tenant_branding', 'custom_css', 'TEXT');
  await addColumn('tenant_branding', 'footer_text', 'TEXT');
  await addColumn('tenant_branding', 'support_email', 'TEXT');
  await addColumn('tenant_branding', 'remove_powered_by', 'INTEGER');

  console.log('--- Fix Complete ---');
  process.exit(0);
}
fix();
