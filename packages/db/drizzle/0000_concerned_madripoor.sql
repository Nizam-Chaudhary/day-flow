CREATE TABLE `app_preferences` (
	`id` integer PRIMARY KEY NOT NULL,
	`default_calendar_view` text NOT NULL,
	`week_starts_on` integer NOT NULL,
	`day_starts_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "app_preferences_singleton_check" CHECK("app_preferences"."id" = 1),
	CONSTRAINT "app_preferences_week_starts_on_check" CHECK("app_preferences"."week_starts_on" in (0, 1)),
	CONSTRAINT "app_preferences_calendar_view_check" CHECK("app_preferences"."default_calendar_view" in ('day', 'week', 'month'))
);
