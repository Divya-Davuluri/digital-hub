CREATE TABLE `analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` text NOT NULL,
	`date` text NOT NULL,
	`clicks` integer DEFAULT 0,
	`impressions` integer DEFAULT 0,
	`conversions` integer DEFAULT 0,
	`spend` integer DEFAULT 0,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `branding` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`logo_url` text,
	`primary_color` text DEFAULT '#4f46e5',
	`secondary_color` text DEFAULT '#10b981',
	`subdomain` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branding_subdomain_unique` ON `branding` (`subdomain`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`budget` integer NOT NULL,
	`channel` text DEFAULT 'google',
	`impressions` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`spend` integer DEFAULT 0,
	`conversions` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`start_date` text,
	`end_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`logo` text,
	`status` text DEFAULT 'active',
	`assigned_to` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`type` text DEFAULT 'info',
	`message` text NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`assigned_to` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`theme_color` text DEFAULT '#4f46e5',
	`subdomain` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_subdomain_unique` ON `tenants` (`subdomain`);--> statement-breakpoint
DROP INDEX "branding_subdomain_unique";--> statement-breakpoint
DROP INDEX "tenants_subdomain_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "role" TO "role" text NOT NULL DEFAULT 'team';--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` ADD `tenant_id` text REFERENCES tenants(id);--> statement-breakpoint
ALTER TABLE `users` ADD `two_factor_temp_secret` text;--> statement-breakpoint
ALTER TABLE `users` ADD `client_id` text REFERENCES clients(id);