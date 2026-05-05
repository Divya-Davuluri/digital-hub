import { AnySQLiteColumn, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- Multi-Tenant Core ---
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  themeColor: text('theme_color').default('#4f46e5'),
  subdomain: text('subdomain').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  provider: text('provider', { enum: ['local', 'google', 'facebook'] }).default('local').notNull(),
  providerId: text('provider_id'),
  role: text('role', { enum: ['admin', 'team', 'client'] }).default('team').notNull(),
  twoFactorEnabled: integer('two_factor_enabled').default(0).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorTempSecret: text('two_factor_temp_secret'),
  clientId: text('client_id').references((): AnySQLiteColumn => clients.id, { onDelete: 'set null' }), // For 'client' role users
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- Agency Business Logic ---
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  logo: text('logo'),
  status: text('status', { enum: ['active', 'inactive', 'pending'] }).default('active'),
  assignedTo: text('assigned_to').references((): AnySQLiteColumn => users.id, { onDelete: 'set null' }), // Assigned Team Member
  companyName: text('company_name'),
  phone: text('phone'),
  plan: text('plan').default('STARTER'),
  assignedTeamMemberId: text('assigned_team_member_id'),
  workspaceCreatedAt: text('workspace_created_at'),
  onboardingStatus: text('onboarding_status').default('PENDING'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  clientName: text('client_name').notNull(),
  plan: text('plan').default('STARTER'),
  status: text('status').default('ACTIVE'),
  settings: text('settings').default('{}'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  budget: integer('budget').notNull(),
  channel: text('channel', { enum: ['google', 'facebook', 'instagram', 'linkedin', 'tiktok'] }).default('google'),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  spend: integer('spend').default(0),
  conversions: integer('conversions').default(0),
  status: text('status', { enum: ['active', 'paused', 'completed', 'review'] }).default('active'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const analytics = sqliteTable('analytics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  conversions: integer('conversions').default(0),
  spend: integer('spend').default(0),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['alert', 'info', 'success', 'warning'] }).default('info'),
  message: text('message').notNull(),
  isRead: integer('is_read').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tenantBranding = sqliteTable('tenant_branding', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#4f46e5'),
  secondaryColor: text('secondary_color').default('#10b981'),
  subdomain: text('subdomain').unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['todo', 'in_progress', 'completed'] }).default('todo').notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- Auth Utilities ---
export const backupCodes = sqliteTable('backup_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  used: integer('used').default(0).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const resetTokens = sqliteTable('reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  type: text('type', { enum: ['password', '2fa'] }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  clientName: text('client_name').notNull(),
  status: text('status', { enum: ['PLANNING', 'IN PROGRESS', 'COMPLETED'] }).default('PLANNING').notNull(),
  completion: integer('completion').default(0).notNull(),
  dueDate: text('due_date').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const reportRequests = sqliteTable('report_requests', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  reportType: text('report_type').notNull(),
  dateFrom: text('date_from'),
  dateTo: text('date_to'),
  notes: text('notes'),
  status: text('status', { enum: ['PENDING', 'COMPLETED', 'REJECTED'] }).default('PENDING').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
