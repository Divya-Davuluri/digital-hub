import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Starting Multi-Tenant Migration...');

  try {
    // 1. Create Workspaces table if not exists
    console.log('📦 Creating workspaces table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 2. Add workspace_id and tenant_id to tables if missing
    const tablesToUpdate = ['users', 'clients', 'projects', 'campaigns', 'tasks', 'notifications'];
    
    for (const table of tablesToUpdate) {
      console.log(`🔧 Checking table: ${table}`);
      const columns = await db.all(sql`PRAGMA table_info(${sql.raw(table)})`);
      const columnNames = (columns as any[]).map(c => c.name);

      if (!columnNames.includes('tenant_id') && table !== 'tenants') {
        console.log(`   ➕ Adding tenant_id to ${table}`);
        await db.run(sql`ALTER TABLE ${sql.raw(table)} ADD COLUMN tenant_id TEXT`);
      }

      if (!columnNames.includes('workspace_id')) {
        console.log(`   ➕ Adding workspace_id to ${table}`);
        await db.run(sql`ALTER TABLE ${sql.raw(table)} ADD COLUMN workspace_id TEXT`);
      }

      if (table === 'users' && !columnNames.includes('role')) {
        console.log(`   ➕ Adding role to users`);
        await db.run(sql`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'`);
      }
      
      if (table === 'campaigns' && !columnNames.includes('client_id')) {
        console.log(`   ➕ Adding client_id to campaigns`);
        await db.run(sql`ALTER TABLE campaigns ADD COLUMN client_id TEXT`);
      }
    }

    // 3. Create report_requests if missing
    console.log('📦 Creating report_requests table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS report_requests (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        report_type TEXT NOT NULL,
        date_from TEXT,
        date_to TEXT,
        notes TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  process.exit(0);
}

migrate();
