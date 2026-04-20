import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import {
    GOOGLE_ACCESS_ROLES,
    GOOGLE_CALENDAR_TYPES,
    GOOGLE_CREDENTIAL_STORAGE_MODES,
    GOOGLE_REMINDER_CHANNELS,
    GOOGLE_SYNC_STATUS_VALUES,
} from '@/schemas/contracts/google-calendar';
import { CALENDAR_VIEWS } from '@/schemas/contracts/settings';

export const appPreferencesTable = sqliteTable(
    'app_preferences',
    {
        id: integer('id').primaryKey(),
        defaultCalendarView: text('default_calendar_view', {
            enum: CALENDAR_VIEWS,
        }).notNull(),
        weekStartsOn: integer('week_starts_on').$type<0 | 1>().notNull(),
        dayStartsAt: text('day_starts_at').notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        check('app_preferences_singleton_check', sql`${table.id} = 1`),
        check('app_preferences_week_starts_on_check', sql`${table.weekStartsOn} in (0, 1)`),
        check(
            'app_preferences_calendar_view_check',
            sql`${table.defaultCalendarView} in ('day', 'week', 'month')`,
        ),
    ],
);

export const integrationConnectionsTable = sqliteTable(
    'integration_connections',
    {
        id: text('id').primaryKey(),
        provider: text('provider').notNull().default('google'),
        externalAccountId: text('external_account_id').notNull(),
        email: text('email').notNull(),
        displayName: text('display_name').notNull(),
        avatarUrl: text('avatar_url'),
        credentialStorageMode: text('credential_storage_mode', {
            enum: GOOGLE_CREDENTIAL_STORAGE_MODES,
        }).notNull(),
        secretRef: text('secret_ref'),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        tokenExpiresAt: text('token_expires_at'),
        scopesJson: text('scopes_json').notNull(),
        lastSyncAt: text('last_sync_at'),
        lastSyncStatus: text('last_sync_status', {
            enum: GOOGLE_SYNC_STATUS_VALUES,
        })
            .notNull()
            .default('idle'),
        lastSyncError: text('last_sync_error'),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        uniqueIndex('integration_connections_provider_external_account_idx').on(
            table.provider,
            table.externalAccountId,
        ),
        check(
            'integration_connections_storage_mode_check',
            sql`${table.credentialStorageMode} in ('keychain', 'sqlite_plaintext')`,
        ),
        check(
            'integration_connections_secret_path_check',
            sql`(
                (${table.credentialStorageMode} = 'keychain' and ${table.secretRef} is not null and ${table.accessToken} is null and ${table.refreshToken} is null)
                or
                (${table.credentialStorageMode} = 'sqlite_plaintext' and ${table.secretRef} is null and ${table.accessToken} is not null)
            )`,
        ),
    ],
);

export const integrationCalendarsTable = sqliteTable(
    'integration_calendars',
    {
        id: text('id').primaryKey(),
        connectionId: text('connection_id')
            .notNull()
            .references(() => integrationConnectionsTable.id, { onDelete: 'cascade' }),
        externalCalendarId: text('external_calendar_id').notNull(),
        name: text('name').notNull(),
        description: text('description'),
        calendarType: text('calendar_type', {
            enum: GOOGLE_CALENDAR_TYPES,
        })
            .notNull()
            .default('other'),
        accessRole: text('access_role', {
            enum: GOOGLE_ACCESS_ROLES,
        })
            .notNull()
            .default('reader'),
        googleBackgroundColor: text('google_background_color'),
        googleForegroundColor: text('google_foreground_color'),
        isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
        isSelected: integer('is_selected', { mode: 'boolean' }).notNull().default(true),
        syncEnabled: integer('sync_enabled', { mode: 'boolean' }).notNull().default(true),
        syncIntervalMinutes: integer('sync_interval_minutes').notNull().default(15),
        reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).notNull().default(false),
        reminderChannel: text('reminder_channel', {
            enum: GOOGLE_REMINDER_CHANNELS,
        })
            .notNull()
            .default('in_app'),
        reminderLeadMinutes: integer('reminder_lead_minutes').notNull().default(15),
        colorOverride: text('color_override'),
        lastSyncAt: text('last_sync_at'),
        lastSyncStatus: text('last_sync_status', {
            enum: GOOGLE_SYNC_STATUS_VALUES,
        })
            .notNull()
            .default('idle'),
        lastSyncError: text('last_sync_error'),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        uniqueIndex('integration_calendars_connection_external_idx').on(
            table.connectionId,
            table.externalCalendarId,
        ),
        index('integration_calendars_connection_idx').on(table.connectionId),
    ],
);

export const calendarEventsTable = sqliteTable(
    'calendar_events',
    {
        id: text('id').primaryKey(),
        provider: text('provider').notNull().default('google'),
        connectionId: text('connection_id')
            .notNull()
            .references(() => integrationConnectionsTable.id, { onDelete: 'cascade' }),
        calendarId: text('calendar_id')
            .notNull()
            .references(() => integrationCalendarsTable.id, { onDelete: 'cascade' }),
        externalEventId: text('external_event_id').notNull(),
        etag: text('etag'),
        status: text('status').notNull().default('confirmed'),
        title: text('title').notNull(),
        description: text('description'),
        location: text('location'),
        startAt: text('start_at').notNull(),
        endAt: text('end_at').notNull(),
        isAllDay: integer('is_all_day', { mode: 'boolean' }).notNull().default(false),
        timezone: text('timezone'),
        htmlLink: text('html_link'),
        rawUpdatedAt: text('raw_updated_at'),
        lastSyncedAt: text('last_synced_at').notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        uniqueIndex('calendar_events_provider_connection_external_idx').on(
            table.provider,
            table.connectionId,
            table.externalEventId,
        ),
        index('calendar_events_calendar_idx').on(table.calendarId),
    ],
);

export type AppPreferencesRow = typeof appPreferencesTable.$inferSelect;
export type IntegrationConnectionRow = typeof integrationConnectionsTable.$inferSelect;
export type IntegrationCalendarRow = typeof integrationCalendarsTable.$inferSelect;
export type CalendarEventRow = typeof calendarEventsTable.$inferSelect;
