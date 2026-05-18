import { db } from '../db';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function fix() {
  console.log('📡 [DB] CONNECTING TO TURSO CLOUD & RUNNING COMPATIBILITY FIXES...');

  // 1. Create Core Tables If Not Exists
  const createTables = [
    // Tenants table
    `CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE,
      custom_domain TEXT UNIQUE,
      logo_url TEXT,
      favicon_url TEXT,
      primary_color TEXT DEFAULT '#6366f1',
      secondary_color TEXT DEFAULT '#4f46e5',
      support_email TEXT,
      custom_css TEXT,
      footer_text TEXT,
      remove_powered_by INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // Workspaces table
    `CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT,
      client_name TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      logo TEXT,
      status TEXT DEFAULT 'active',
      primary_color TEXT DEFAULT '#4f46e5',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // Workflows table
    `CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      client_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      trigger_type TEXT DEFAULT 'form_submit',
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      enrolled_count INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      conversion_count INTEGER DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      last_run_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Contacts table
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      workspace_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`
  ];

  for (const query of createTables) {
    try {
      await db.run(sql.raw(query));
      console.log('✅ Table created or verified successfully');
    } catch (e) {
      console.error('Error creating table:', (e as any).message);
    }
  }

  // 2. Self-Healing Column Alignments (Adding columns safely if tables were created with partial columns previously)
  const columnsToVerify = [
    { table: 'tenants', column: 'custom_domain', type: 'TEXT' },
    { table: 'tenants', column: 'logo_url', type: 'TEXT' },
    { table: 'tenants', column: 'favicon_url', type: 'TEXT' },
    { table: 'tenants', column: 'primary_color', type: "TEXT DEFAULT '#6366f1'" },
    { table: 'tenants', column: 'secondary_color', type: "TEXT DEFAULT '#4f46e5'" },
    { table: 'tenants', column: 'support_email', type: 'TEXT' },
    { table: 'tenants', column: 'custom_css', type: 'TEXT' },
    { table: 'tenants', column: 'footer_text', type: 'TEXT' },
    { table: 'tenants', column: 'remove_powered_by', type: 'INTEGER DEFAULT 0' },
    { table: 'tenants', column: 'status', type: "TEXT DEFAULT 'active'" },
    { table: 'tenants', column: 'created_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
  ];

  console.log('🔄 Checking and correcting table column structures...');
  for (const { table, column, type } of columnsToVerify) {
    try {
      await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`));
      console.log(`➕ Added missing column: ${table}.${column}`);
    } catch (e: any) {
      // Catch duplicate column errors silently, this means the table is already up to date
      if (!e.message.includes('duplicate column') && !e.message.includes('already exists')) {
        console.warn(`⚠️ Columns verify check warning for ${table}.${column}:`, e.message);
      }
    }
  }

  // 3. Seed Default Tenant
  console.log('🌱 Seeding default workspace & automation parameters...');
  const tenantId = 'default-tenant';
  const workspaceId = 'default-workspace';

  try {
    const existingTenant = await db.run(sql`SELECT id FROM tenants WHERE id = ${tenantId}`);
    if (existingTenant.rows.length === 0) {
      await db.run(sql`
        INSERT INTO tenants (id, name, subdomain, primary_color, secondary_color, status)
        VALUES (${tenantId}, 'Default Agency', 'default', '#6366f1', '#4f46e5', 'active')
      `);
      console.log('🎉 Seeded default tenant: "Default Agency"');
    } else {
      console.log('👉 Default tenant already exists.');
    }
  } catch (e: any) {
    console.error('❌ Failed seeding tenant:', e.message);
  }

  // 4. Seed Default Workspace
  try {
    const existingWorkspace = await db.run(sql`SELECT id FROM workspaces WHERE id = ${workspaceId}`);
    if (existingWorkspace.rows.length === 0) {
      await db.run(sql`
        INSERT INTO workspaces (id, tenant_id, name, slug, status, primary_color)
        VALUES (${workspaceId}, ${tenantId}, 'Default Workspace', 'default-slug', 'active', '#4f46e5')
      `);
      console.log('🎉 Seeded default workspace: "Default Workspace"');
    } else {
      console.log('👉 Default workspace already exists.');
    }
  } catch (e: any) {
    console.error('❌ Failed seeding workspace:', e.message);
  }

  // 5. Seed an Active Workflow for immediate Contact Form -> Welcoming series triggers
  try {
    const activeWorkflow = await db.run(sql`
      SELECT id FROM workflows 
      WHERE tenant_id = ${tenantId} AND trigger_type = 'form_submit' AND status = 'active'
    `);
    
    if (activeWorkflow.rows.length === 0) {
      const flowId = uuidv4();
      const nodes = [
        {
          id: 'n1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Form Submit',
            type: 'trigger',
            icon: '🎯',
            description: 'Contact fills a form',
            config: { formId: 'any' }
          }
        },
        {
          id: 'n2',
          type: 'conditionNode',
          position: { x: 250, y: 180 },
          data: {
            label: 'Wait 1 Minute',
            type: 'condition',
            icon: '⏰',
            description: 'Wait 1 minute before sending',
            config: { delay: 1, unit: 'minutes' }
          }
        },
        {
          id: 'n3',
          type: 'actionNode',
          position: { x: 250, y: 310 },
          data: {
            label: 'Send Welcome Email',
            type: 'action',
            icon: '📧',
            description: 'Send welcoming email',
            config: {
              subject: 'Welcome to HubSaaS',
              body: 'Hello {{name}},\n\nThank you for contacting us.\n\nBest regards,\nHubSaaS Team',
              template: 'welcome'
            }
          }
        },
        {
          id: 'n4',
          type: 'endNode',
          position: { x: 250, y: 440 },
          data: {
            label: 'Flow Complete',
            type: 'end',
            icon: '🏁',
            description: 'Sequence finished',
            config: {}
          }
        }
      ];

      const edges = [
        { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
        { id: 'e2-3', source: 'n2', target: 'n3', animated: true },
        { id: 'e3-4', source: 'n3', target: 'n4', animated: true }
      ];

      await db.run(sql`
        INSERT INTO workflows (
          id, tenant_id, workspace_id, name, description, status, trigger_type, nodes, edges, 
          enrolled_count, completed_count, conversion_count, conversion_rate
        ) VALUES (
          ${flowId}, ${tenantId}, ${workspaceId}, 'Contact Form Automation', 
          'Welcomes new contacts with automated delayed email', 'active', 'form_submit', 
          ${JSON.stringify(nodes)}, ${JSON.stringify(edges)}, 0, 0, 0, 0
        )
      `);
      console.log('🎉 Seeded active automated contact form workflow series successfully!');
    } else {
      console.log('👉 Default active contact automation workflow already present.');
    }
  } catch (e: any) {
    console.error('❌ Failed seeding default active contact workflow:', e.message);
  }

  console.log('🚀 [DB] ALL COMPATIBILITY REPAIR TASKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

fix();
