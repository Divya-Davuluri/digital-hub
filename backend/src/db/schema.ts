import { AnySQLiteColumn, sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// --- Multi-Tenant Core ---

/**
 * Agencies / SaaS Accounts
 */
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  themeColor: text('theme_color').default('#4f46e5'),
  subdomain: text('subdomain').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Client Workspaces (Isolation Layer)
 */
export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: text('client_id'), // Legacy support
  clientName: text('client_name'), // Legacy support
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  logo: text('logo'),
  status: text('status', { enum: ['active', 'inactive', 'pending'] }).default('active'),
  primaryColor: text('primary_color').default('#4f46e5'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }), // Isolated workspace access
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  provider: text('provider', { enum: ['local', 'google', 'facebook'] }).default('local').notNull(),
  providerId: text('provider_id'),
  role: text('role', { enum: ['admin', 'team', 'client'] }).default('team').notNull(),
  status: text('status', { enum: ['active', 'inactive', 'pending'] }).default('active'),
  onboardingCompleted: integer('onboarding_completed').default(0).notNull(),
  onboardingStep: text('onboarding_step').default('start'),
  firstLogin: integer('first_login').default(1).notNull(),
  twoFactorEnabled: integer('two_factor_enabled').default(0).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorTempSecret: text('two_factor_temp_secret'),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- Agency Business Logic ---

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  companyName: text('company_name'),
  status: text('status', { enum: ['active', 'inactive', 'pending'] }).default('active'),
  plan: text('plan', { enum: ['starter', 'pro', 'enterprise'] }).default('starter'),
  assignedTeamMemberId: text('assigned_team_member_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ... (rest of the tables)

export const invitations = sqliteTable('invitations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  used: integer('used').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});


export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  budget: real('budget').notNull(),
  spent: real('spent').default(0),
  channel: text('channel').default('google'),
  platform: text('platform').default('Meta'),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  ctr: real('ctr').default(0),
  status: text('status').default('ACTIVE'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  headline: text('headline'),
  cta: text('cta'),
  creativeUrl: text('creative_url'),
  createdBy: text('created_by'),
  assignedTeamMemberId: text('assigned_team_member_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const adGroups = sqliteTable('ad_groups', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  budget: integer('budget').notNull(),
  status: text('status', { enum: ['active', 'paused', 'completed'] }).default('active'),
  targeting: text('targeting'), // JSON string for flexibility
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const creatives = sqliteTable('creatives', {
  id: text('id').primaryKey(),
  adGroupId: text('ad_group_id').references(() => adGroups.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['image', 'video', 'carousel'] }).default('image'),
  url: text('url').notNull(),
  headline: text('headline'),
  description: text('description'),
  callToAction: text('call_to_action'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const campaignTemplates = sqliteTable('campaign_templates', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  channel: text('channel', { enum: ['google', 'facebook', 'instagram', 'linkedin', 'tiktok'] }).notNull(),
  objective: text('objective'),
  defaultBudget: integer('default_budget'),
  defaultTargeting: text('default_targeting'), // JSON
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- DAY 9: BUDGET POOLS & AUTOMATION ---

export const budgetPools = sqliteTable('budget_pools', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  workspaceId: text('workspace_id').notNull(),
  name: text('name').notNull(),
  totalBudget: real('total_budget').notNull(),
  spent: real('spent').default(0),
  remaining: real('remaining').default(0),
  currency: text('currency').default('USD'),
  status: text('status', { enum: ['active', 'exhausted', 'paused'] }).default('active'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const automationRules = sqliteTable('automation_rules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  workspaceId: text('workspace_id').notNull(),
  targetType: text('target_type', { enum: ['campaign', 'ad_group', 'pool'] }).notNull(),
  targetId: text('target_id').notNull(), // ID of the campaign/ad_group/pool
  name: text('name').notNull(),
  triggerMetric: text('trigger_metric', { enum: ['spend', 'cpa', 'roas', 'clicks', 'impressions'] }).notNull(),
  operator: text('operator', { enum: ['>', '<', '>=', '<='] }).notNull(),
  threshold: real('threshold').notNull(),
  action: text('action', { enum: ['pause', 'scale_up', 'scale_down', 'notify'] }).notNull(),
  actionValue: real('action_value'), // e.g., 20 for 20% increase
  isActive: integer('is_active').default(1),
  lastRunAt: text('last_run_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const spendingForecasts = sqliteTable('spending_forecasts', {
  id: text('id').primaryKey(),
  targetId: text('target_id').notNull(),
  forecastDate: text('forecast_date').notNull(),
  predictedSpend: real('predicted_spend').notNull(),
  confidenceInterval: real('confidence_interval').default(0.95),
  metadata: text('metadata'), // JSON for extra data points
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- DAY 10: WHITE-LABELING & CUSTOM DOMAINS ---

export const customBranding = sqliteTable('custom_branding', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().unique(),
  agencyName: text('agency_name'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: text('primary_color').default('#6366f1'),
  secondaryColor: text('secondary_color').default('#4f46e5'),
  customCss: text('custom_css'),
  supportEmail: text('support_email'),
  removePoweredBy: integer('remove_powered_by').default(0),
  footerText: text('footer_text'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const customDomains = sqliteTable('custom_domains', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  domain: text('domain').notNull().unique(),
  status: text('status', { enum: ['pending', 'active', 'failed'] }).default('pending'),
  isVerified: integer('is_verified').default(0),
  sslStatus: text('ssl_status').default('none'),
  lastCheckedAt: text('last_checked_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const campaignActivityLogs = sqliteTable('campaign_activity_logs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'CREATE', 'PAUSE', 'RESUME', 'UPDATE_BUDGET', etc.
  details: text('details'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const analytics = sqliteTable('analytics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  conversions: integer('conversions').default(0),
  spent: real('spent').default(0),
  totalSpent: real('total_spent').default(0),
  roas: real('roas').default(0),
});

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  report_name: text('report_name').notNull(),
  client_name: text('client_name'),
  campaign: text('campaign').default('All Campaigns'),
  type: text('type').default('PERFORMANCE'), // PERFORMANCE, CAMPAIGN, ANALYTICS, BUDGET, CLIENT_SUMMARY
  period: text('period').default('Last 30 Days'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status').default('completed'), // pending, generating, completed, failed
  totalSpend: real('total_spend').default(0),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  roas: real('roas').default(0),
  file_url: text('file_url'),
  requestedBy: text('requested_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const reportRequests = sqliteTable('report_requests', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  reportType: text('report_type').notNull(),
  dateFrom: text('date_from'),
  dateTo: text('date_to'),
  notes: text('notes'),
  status: text('status', { enum: ['PENDING', 'COMPLETED', 'REJECTED'] }).default('PENDING').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  clientName: text('client_name'),
  status: text('status', { enum: ['todo', 'in_progress', 'completed', 'PENDING', 'COMPLETED'] }).default('PENDING').notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH'] }).default('MEDIUM').notNull(),
  dueDate: text('due_date'),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['alert', 'info', 'success', 'warning'] }).default('info'),
  message: text('message').notNull(),
  isRead: integer('is_read').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const backupCodes = sqliteTable('backup_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  used: integer('used').default(0).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
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
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  clientName: text('client_name'),
  status: text('status', { enum: ['PLANNING', 'IN PROGRESS', 'COMPLETED'] }).default('PLANNING'),
  completion: integer('completion').default(0),
  dueDate: text('due_date'),
  targetDate: text('target_date'),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
export const tenantBranding = sqliteTable('tenant_branding', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#4f46e5'),
  secondaryColor: text('secondary_color').default('#10b981'),
  subdomain: text('subdomain'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: text('type').notNull(), // 'Subscription', 'Project', etc.
  status: text('status').notNull(), // 'paid', 'pending', etc.
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
