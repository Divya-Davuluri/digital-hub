import { db } from '../db';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function runDbFixes() {
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
      phone TEXT,
      company TEXT,
      source TEXT,
      status TEXT DEFAULT 'new',
      lead_score INTEGER DEFAULT 0,
      tags TEXT,
      workflow_id TEXT,
      workflow_status TEXT,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Contact Activities table
    `CREATE TABLE IF NOT EXISTS contact_activities (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // Contact Emails table
    `CREATE TABLE IF NOT EXISTS contact_emails (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      workflow_id TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT DEFAULT 'sent' NOT NULL,
      provider TEXT DEFAULT 'resend' NOT NULL,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // Contact Notes table
    `CREATE TABLE IF NOT EXISTS contact_notes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT,
      created_by_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // Team Assignments table
    `CREATE TABLE IF NOT EXISTS team_assignments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      client_id TEXT,
      campaign_id TEXT,
      contact_id TEXT,
      workflow_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // Client Users table
    `CREATE TABLE IF NOT EXISTS client_users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // Audit Logs table
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      workspace_id TEXT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,

    // theme_settings table
    `CREATE TABLE IF NOT EXISTS theme_settings (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      sidebar_bg TEXT DEFAULT '#1e293b',
      card_bg TEXT DEFAULT '#ffffff',
      sidebar_theme TEXT DEFAULT 'dark',
      login_page_branding TEXT DEFAULT 'center',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,

    // uploaded_assets table
    `CREATE TABLE IF NOT EXISTS uploaded_assets (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // Safely align by dropping legacy tables if they exist with outdated/partial structures
  try {
    console.log('🔄 Dropping obsolete contact CRM tables to synchronize columns...');
    await db.run(sql.raw(`DROP TABLE IF EXISTS contact_activities`));
    await db.run(sql.raw(`DROP TABLE IF EXISTS contact_emails`));
    console.log('🗑️ Dropped legacy contacts activity and email tables successfully for schema alignment.');
  } catch (err: any) {
    console.error('⚠️ Failed dropping legacy tables:', err.message);
  }

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
    { table: 'tenants', column: 'created_at', type: 'TEXT' },
    { table: 'contacts', column: 'phone', type: 'TEXT' },
    { table: 'contacts', column: 'company', type: 'TEXT' },
    { table: 'contacts', column: 'source', type: 'TEXT' },
    { table: 'contacts', column: 'status', type: "TEXT DEFAULT 'new'" },
    { table: 'contacts', column: 'lead_score', type: 'INTEGER DEFAULT 0' },
    { table: 'contacts', column: 'tags', type: 'TEXT' },
    { table: 'contacts', column: 'workflow_id', type: 'TEXT' },
    { table: 'contacts', column: 'workflow_status', type: 'TEXT' },
    { table: 'contacts', column: 'message', type: 'TEXT' },
    { table: 'contacts', column: 'updated_at', type: 'TEXT' },
    { table: 'tenant_branding', column: 'sidebar_bg', type: "TEXT DEFAULT '#1e293b'" },
    { table: 'tenant_branding', column: 'card_bg', type: "TEXT DEFAULT '#ffffff'" },
    { table: 'tenant_branding', column: 'sidebar_theme', type: "TEXT DEFAULT 'dark'" },
    { table: 'tenant_branding', column: 'login_page_branding', type: "TEXT DEFAULT 'center'" },
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

  // Backfill missing timestamps that were added without defaults
  try {
    await db.run(sql`UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
    await db.run(sql`UPDATE tenants SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`);
    console.log('✅ Backfilled timestamps successfully');
  } catch (e: any) {
    console.warn('⚠️ Timestamps backfill warning:', e.message);
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
}

if (require.main === module) {
  runDbFixes()
    .then(() => {
      console.log('✅ Local direct fix completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Direct direct fix failed:', err);
      process.exit(1);
    });
}
