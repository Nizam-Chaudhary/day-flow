ALTER TABLE `integration_calendars`
ADD `reminder_lead_minutes_json` text DEFAULT '[15]' NOT NULL;
--> statement-breakpoint
UPDATE `integration_calendars`
SET `reminder_lead_minutes_json` = json_array(`reminder_lead_minutes`);
--> statement-breakpoint
ALTER TABLE `integration_calendars` DROP COLUMN `reminder_lead_minutes`;
