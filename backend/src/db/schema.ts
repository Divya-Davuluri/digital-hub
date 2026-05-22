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
  subdomain: text('subdomain').unique(),
  customDomain: text('custom_domain').unique(),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  primaryColor: text('primary_color').default('#6366f1'),
  secondaryColor: text('secondary_color').default('#4f46e5'),
  supportEmail: text('support_email'),
  customCss: text('custom_css'),
  footerText: text('footer_text'),
  removePoweredBy: integer('remove_powered_by').default(0),
  status: text('status').default('active'),
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
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  totalBudget: real('total_budget').notNull(),
  allocatedBudget: real('allocated_budget').default(0),
  remainingBudget: real('remaining_budget').default(0),
  currency: text('currency').default('USD'),
  period: text('period').default('monthly'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  autoReallocate: integer('auto_reallocate').default(1),
  status: text('status').default('active'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

export const budgetAllocations = sqliteTable('budget_allocations', {
  id: text('id').primaryKey(),
  poolId: text('pool_id').notNull()
    .references(() => budgetPools.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(), // 'meta','tiktok','google','snapchat','pinterest'
  allocatedAmount: real('allocated_amount').default(0),
  spentAmount: real('spent_amount').default(0),
  remainingAmount: real('remaining_amount').default(0),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  conversions: integer('conversions').default(0),
  revenue: real('revenue').default(0),
  roas: real('roas').default(0),
  ctr: real('ctr').default(0),
  cvr: real('cvr').default(0),
  performanceScore: real('performance_score').default(0),
  autoAdjust: integer('auto_adjust').default(1),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
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
  name: text('name'), // Legacy column support
  url: text('url'), // Legacy column support
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
export const tenantBranding = sqliteTable(
  'tenant_branding', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  agencyName: text('agency_name').default(''),
  primaryColor: text('primary_color').default('#6366f1'),
  secondaryColor: text('secondary_color').default('#4f46e5'),
  logoUrl: text('logo_url').default(''),
  faviconUrl: text('favicon_url').default(''),
  supportEmail: text('support_email').default(''),
  customCss: text('custom_css').default(''),
  footerText: text('footer_text').default(''),
  removePoweredBy: integer('remove_powered_by').default(0),
  sidebarBg: text('sidebar_bg').default('#1e293b'),
  cardBg: text('card_bg').default('#ffffff'),
  sidebarTheme: text('sidebar_theme').default('dark'),
  loginPageBranding: text('login_page_branding').default('center'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

export const themeSettings = sqliteTable('theme_settings', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  sidebarBg: text('sidebar_bg').default('#1e293b'),
  cardBg: text('card_bg').default('#ffffff'),
  sidebarTheme: text('sidebar_theme').default('dark'),
  loginPageBranding: text('login_page_branding').default('center'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const uploadedAssets = sqliteTable('uploaded_assets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull(), // 'logo' | 'favicon' | 'other'
  size: integer('size'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const creativeAssets = sqliteTable('creative_assets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name'),
  url: text('url'),
  type: text('type'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
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
// --- DAY 11: ATTRIBUTION REPORTING ENGINE ---

// Customer Journey Touch Points
export const touchpoints = sqliteTable('touchpoints', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  channel: text('channel').notNull(),
  campaignId: text('campaign_id'),
  touchpointType: text('touchpoint_type').notNull(),
  // 'impression','click','visit','lead','purchase'
  revenue: real('revenue').default(0),
  spend: real('spend').default(0),
  position: integer('position').default(0),
  // position in customer journey
  occurredAt: text('occurred_at').notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Attribution Results per Model
export const attributionResults = sqliteTable(
  'attribution_results', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  model: text('model').notNull(),
  // 'first_touch','last_touch','linear','time_decay'
  attributedRevenue: real('attributed_revenue').default(0),
  attributedConversions: real('attributed_conversions')
    .default(0),
  spend: real('spend').default(0),
  roas: real('roas').default(0),
  creditPercentage: real('credit_percentage').default(0),
  period: text('period').default('Last 30 Days'),
  calculatedAt: text('calculated_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
});
// --- DAY 12: UNIFIED SOCIAL SCHEDULING ---

// Social Posts Table
export const socialPosts = sqliteTable('social_posts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  // 'image' | 'video' | 'carousel' | 'text'
  platforms: text('platforms').notNull(),
  // JSON string: '["meta","tiktok","linkedin"]'
  scheduledAt: text('scheduled_at'),
  publishedAt: text('published_at'),
  status: text('status').default('draft'),
  // 'draft'|'pending'|'approved'|'scheduled'
  // |'published'|'rejected'|'failed'
  approvedBy: text('approved_by')
    .references(() => users.id, { onDelete: 'set null' }),
  rejectedReason: text('rejected_reason'),
  hashtags: text('hashtags'),
  // JSON string: '["#marketing","#digital"]'
  firstComment: text('first_comment'),
  bestTimeScore: real('best_time_score').default(0),
  createdBy: text('created_by')
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

// Content Library Table
export const contentLibrary = sqliteTable('content_library', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  // 'template'|'caption'|'hashtag_set'|'asset'
  content: text('content'),
  mediaUrl: text('media_url'),
  tags: text('tags'),
  // JSON string: '["sale","summer"]'
  usageCount: integer('usage_count').default(0),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('draft'),
  // 'draft' | 'active' | 'paused' | 'archived'
  triggerType: text('trigger_type').default('form_submit'),
  // 'form_submit'|'email_open'|'link_click'
  // |'purchase'|'ad_engagement'|'new_lead'|'scheduled'
  nodes: text('nodes').notNull().default('[]'),
  // JSON string of ReactFlow nodes array
  edges: text('edges').notNull().default('[]'),
  // JSON string of ReactFlow edges array
  enrolledCount: integer('enrolled_count').default(0),
  completedCount: integer('completed_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  conversionRate: real('conversion_rate').default(0),
  lastRunAt: text('last_run_at'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workflowTemplates = sqliteTable(
  'workflow_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  // 'welcome'|'retargeting'|'abandoned_cart'
  // |'nurture'|'reengagement'
  icon: text('icon').default('⚡'),
  nodes: text('nodes').notNull().default('[]'),
  edges: text('edges').notNull().default('[]'),
  usageCount: integer('usage_count').default(0),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- DAY 14: LINK MANAGEMENT MODULE ---

// Bio Pages Table (Linktree-style)
export const bioPages = sqliteTable('bio_pages', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  // e.g. 'nikemkt' → dmhub.link/nikemkt
  title: text('title').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  backgroundType: text('background_type')
    .default('color'),
  // 'color' | 'gradient' | 'image'
  backgroundColor: text('background_color')
    .default('#6366f1'),
  backgroundGradient: text('background_gradient'),
  backgroundImage: text('background_image'),
  fontFamily: text('font_family').default('Inter'),
  buttonStyle: text('button_style').default('rounded'),
  // 'rounded' | 'pill' | 'square'
  buttonColor: text('button_color').default('#ffffff'),
  buttonTextColor: text('button_text_color')
    .default('#000000'),
  links: text('links').notNull().default('[]'),
  // JSON array of link objects
  totalClicks: integer('total_clicks').default(0),
  totalViews: integer('total_views').default(0),
  isPublished: integer('is_published').default(1),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

// Short Links Table (Bitly-style)
export const shortLinks = sqliteTable('short_links', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  originalUrl: text('original_url').notNull(),
  shortCode: text('short_code').notNull().unique(),
  // e.g. 'abc123'
  customAlias: text('custom_alias'),
  // e.g. 'summer-sale'
  campaignId: text('campaign_id'),
  // group links by campaign
  campaignName: text('campaign_name'),
  totalClicks: integer('total_clicks').default(0),
  uniqueClicks: integer('unique_clicks').default(0),
  qrCodeUrl: text('qr_code_url'),
  isActive: integer('is_active').default(1),
  expiresAt: text('expires_at'),
  metaPixelId: text('meta_pixel_id'),
  tiktokPixelId: text('tiktok_pixel_id'),
  googleTagId: text('google_tag_id'),
  password: text('password'),
  scheduledAt: text('scheduled_at'),
  clickData: text('click_data').default('[]'),
  // JSON array of click events
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

// Link Click Events Table
export const linkClicks = sqliteTable('link_clicks', {
  id: text('id').primaryKey(),
  linkId: text('link_id').notNull(),
  // references shortLinks.id or bioPages.id
  linkType: text('link_type').notNull(),
  // 'short_link' | 'bio_page'
  country: text('country'),
  city: text('city'),
  device: text('device'),
  // 'mobile' | 'desktop' | 'tablet'
  browser: text('browser'),
  os: text('os'),
  referrer: text('referrer'),
  ipAddress: text('ip_address'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  clickedAt: text('clicked_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- DAY 15: INSTAGRAM DM AUTOMATION ---

export const dmAutomations = sqliteTable(
  'dm_automations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  // 'comment_to_dm' | 'story_reply' | 'story_reaction'
  // | 'live_automation' | 'dm_sequence' | 'auto_reply'
  triggerKeyword: text('trigger_keyword'),
  triggerCondition: text('trigger_condition')
    .default('contains'),
  // 'contains' | 'equals' | 'starts_with' | 'any'
  replyMessage: text('reply_message').notNull(),
  followUpMessages: text('follow_up_messages')
    .default('[]'),
  // JSON: [{day:3, message:"..."}, {day:7, ...}]
  isActive: integer('is_active').default(1),
  totalTriggered: integer('total_triggered').default(0),
  totalReplied: integer('total_replied').default(0),
  totalConverted: integer('total_converted').default(0),
  instagramAccountId: text('instagram_account_id'),
  postId: text('post_id').default('any'),
  excludeKeywords: text('exclude_keywords')
    .default('[]'),
  dailyLimit: integer('daily_limit').default(100),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

export const dmSequences = sqliteTable(
  'dm_sequences', {
  id: text('id').primaryKey(),
  automationId: text('automation_id').notNull()
    .references(() => dmAutomations.id,
      { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull(),
  contactUsername: text('contact_username'),
  currentStep: integer('current_step').default(0),
  status: text('status').default('active'),
  // 'active'|'completed'|'paused'|'unsubscribed'
  lastMessageAt: text('last_message_at'),
  nextMessageAt: text('next_message_at'),
  convertedAt: text('converted_at'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id'),
  workspaceId: text('workspace_id'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  source: text('source'),
  status: text('status').default('new'),
  leadScore: integer('lead_score').default(0),
  tags: text('tags'),
  workflowId: text('workflow_id'),
  workflowStatus: text('workflow_status'),
  message: text('message'),
  assignedTeamMemberId: text('assigned_team_member_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const contactActivities = sqliteTable('contact_activities', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  activityType: text('activity_type').notNull(),
  activityMessage: text('activity_message').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const contactEmails = sqliteTable('contact_emails', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').references(() => workflows.id, { onDelete: 'set null' }),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').default('sent').notNull(), // 'sent', 'delivered', 'failed', 'opened', 'clicked'
  provider: text('provider').default('resend').notNull(),
  messageId: text('message_id'), // provider's message ID for webhooks
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  sentAt: text('sent_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const contactNotes = sqliteTable('contact_notes', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdByName: text('created_by_name'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- RBAC & Auditing ---

export const teamAssignments = sqliteTable('team_assignments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const clientUsers = sqliteTable('client_users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  details: text('details'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// --- DAY 17: WORKFLOW ENGINE & PERSISTENCE ---

export const workflowExecutionQueue = sqliteTable('workflow_execution_queue', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed', 'delayed'] }).default('pending'),
  executeAt: text('execute_at').notNull(), // ISO timestamp
  retryCount: integer('retry_count').default(0),
  error: text('error'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const workflowExecutionLogs = sqliteTable('workflow_execution_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  status: text('status').notNull(), // success, failed
  details: text('details'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// SEO Keywords Tracking Table
export const seoKeywords = sqliteTable(
  'seo_keywords', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id,
      { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id,
      { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id,
      { onDelete: 'cascade' }),
  keyword: text('keyword').notNull(),
  domain: text('domain'),
  currentRank: integer('current_rank'),
  previousRank: integer('previous_rank'),
  bestRank: integer('best_rank'),
  searchVolume: integer('search_volume').default(0),
  difficulty: integer('difficulty').default(0),
  // 0-100
  cpc: real('cpc').default(0),
  intent: text('intent').default('informational'),
  // 'informational'|'commercial'|'transactional'
  // |'navigational'
  cluster: text('cluster'),
  // topic cluster name
  rankChange: integer('rank_change').default(0),
  // positive = moved up, negative = moved down
  isTracked: integer('is_tracked').default(1),
  device: text('device').default('desktop'),
  // 'desktop'|'mobile'
  country: text('country').default('US'),
  lastChecked: text('last_checked'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});

// SEO Site Audit Issues Table
export const seoAuditIssues = sqliteTable(
  'seo_audit_issues', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id,
      { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id,
      { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id,
      { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  issueType: text('issue_type').notNull(),
  // 'broken_link'|'missing_meta'|'slow_page'
  // |'missing_h1'|'duplicate_content'
  // |'missing_alt'|'core_web_vitals'
  severity: text('severity').default('medium'),
  // 'critical'|'high'|'medium'|'low'
  url: text('url').notNull(),
  description: text('description'),
  recommendation: text('recommendation'),
  isFixed: integer('is_fixed').default(0),
  auditDate: text('audit_date'),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// SEO Content Briefs Table
export const seoContentBriefs = sqliteTable(
  'seo_content_briefs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull()
    .references(() => tenants.id,
      { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull()
    .references(() => workspaces.id,
      { onDelete: 'cascade' }),
  clientId: text('client_id')
    .references(() => clients.id,
      { onDelete: 'cascade' }),
  targetKeyword: text('target_keyword').notNull(),
  title: text('title').notNull(),
  suggestedWordCount: integer('suggested_word_count')
    .default(1500),
  headings: text('headings').default('[]'),
  // JSON array of suggested H2/H3 headings
  keywords: text('keywords').default('[]'),
  // JSON array of related keywords to include
  competitors: text('competitors').default('[]'),
  // JSON array of competing URLs
  searchVolume: integer('search_volume').default(0),
  difficulty: integer('difficulty').default(0),
  intent: text('intent').default('informational'),
  status: text('status').default('draft'),
  // 'draft'|'in_progress'|'completed'
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`),
});
