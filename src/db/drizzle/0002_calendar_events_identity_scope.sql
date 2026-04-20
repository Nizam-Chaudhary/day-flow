DROP INDEX `calendar_events_provider_connection_external_idx`;
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_events_provider_connection_calendar_external_idx` ON `calendar_events` (`provider`,`connection_id`,`calendar_id`,`external_event_id`);
