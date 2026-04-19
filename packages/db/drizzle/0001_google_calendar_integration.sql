CREATE TABLE `integration_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'google' NOT NULL,
	`external_account_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`credential_storage_mode` text NOT NULL,
	`secret_ref` text,
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` text,
	`scopes_json` text NOT NULL,
	`last_sync_at` text,
	`last_sync_status` text DEFAULT 'idle' NOT NULL,
	`last_sync_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "integration_connections_storage_mode_check" CHECK("integration_connections"."credential_storage_mode" in ('keychain', 'sqlite_plaintext')),
	CONSTRAINT "integration_connections_secret_path_check" CHECK((
                ("integration_connections"."credential_storage_mode" = 'keychain' and "integration_connections"."secret_ref" is not null and "integration_connections"."access_token" is null and "integration_connections"."refresh_token" is null)
                or
                ("integration_connections"."credential_storage_mode" = 'sqlite_plaintext' and "integration_connections"."secret_ref" is null and "integration_connections"."access_token" is not null)
            ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_connections_provider_external_account_idx` ON `integration_connections` (`provider`,`external_account_id`);
--> statement-breakpoint
CREATE TABLE `integration_calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`connection_id` text NOT NULL,
	`external_calendar_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`calendar_type` text DEFAULT 'other' NOT NULL,
	`access_role` text DEFAULT 'reader' NOT NULL,
	`google_background_color` text,
	`google_foreground_color` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`is_selected` integer DEFAULT true NOT NULL,
	`sync_enabled` integer DEFAULT true NOT NULL,
	`sync_interval_minutes` integer DEFAULT 15 NOT NULL,
	`reminder_enabled` integer DEFAULT false NOT NULL,
	`reminder_channel` text DEFAULT 'in_app' NOT NULL,
	`reminder_lead_minutes` integer DEFAULT 15 NOT NULL,
	`color_override` text,
	`last_sync_at` text,
	`last_sync_status` text DEFAULT 'idle' NOT NULL,
	`last_sync_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`connection_id`) REFERENCES `integration_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integration_calendars_connection_external_idx` ON `integration_calendars` (`connection_id`,`external_calendar_id`);
--> statement-breakpoint
CREATE INDEX `integration_calendars_connection_idx` ON `integration_calendars` (`connection_id`);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'google' NOT NULL,
	`connection_id` text NOT NULL,
	`calendar_id` text NOT NULL,
	`external_event_id` text NOT NULL,
	`etag` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`is_all_day` integer DEFAULT false NOT NULL,
	`timezone` text,
	`html_link` text,
	`raw_updated_at` text,
	`last_synced_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`connection_id`) REFERENCES `integration_connections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`calendar_id`) REFERENCES `integration_calendars`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_events_provider_connection_external_idx` ON `calendar_events` (`provider`,`connection_id`,`external_event_id`);
--> statement-breakpoint
CREATE INDEX `calendar_events_calendar_idx` ON `calendar_events` (`calendar_id`);
