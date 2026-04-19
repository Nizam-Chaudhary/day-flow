import type {
    GoogleCalendarSummary,
    GoogleConnectionDetail,
    GoogleConnectionSummary,
    GoogleOAuthTokenSet,
    UpdateGoogleCalendarInput,
} from '@day-flow/contracts/google-calendar';

import {
    GOOGLE_REMINDER_LEAD_OPTIONS,
    GOOGLE_SYNC_INTERVAL_OPTIONS,
} from '@day-flow/contracts/google-calendar';
import { and, eq, inArray } from 'drizzle-orm';

import type { DatabaseClient } from './client';
import type { CalendarEventRow, IntegrationCalendarRow, IntegrationConnectionRow } from './schema';

import {
    calendarEventsTable,
    integrationCalendarsTable,
    integrationConnectionsTable,
} from './schema';

export interface PersistGoogleConnectionInput {
    avatarUrl: string | null;
    calendars: Array<{
        accessRole: GoogleCalendarSummary['accessRole'];
        calendarType: GoogleCalendarSummary['type'];
        externalCalendarId: string;
        googleBackgroundColor: string | null;
        googleForegroundColor: string | null;
        isPrimary: boolean;
        name: string;
    }>;
    credentialStorageMode: GoogleConnectionSummary['credentialStorageMode'];
    displayName: string;
    email: string;
    externalAccountId: string;
    scopes: string[];
    secretRef: string | null;
    tokens: GoogleOAuthTokenSet | null;
}

export class GoogleRepository {
    constructor(private readonly client: DatabaseClient) {}

    listConnections(): GoogleConnectionSummary[] {
        const rows = this.client.db
            .select()
            .from(integrationConnectionsTable)
            .where(eq(integrationConnectionsTable.provider, 'google'))
            .all();

        return rows.map((row) => this.mapConnectionSummary(row));
    }

    getConnectionDetail(connectionId: string): GoogleConnectionDetail | null {
        const connectionRow = this.client.db
            .select()
            .from(integrationConnectionsTable)
            .where(eq(integrationConnectionsTable.id, connectionId))
            .get();

        if (!connectionRow) {
            return null;
        }

        const calendars = this.client.db
            .select()
            .from(integrationCalendarsTable)
            .where(eq(integrationCalendarsTable.connectionId, connectionId))
            .all()
            .map((row) => this.mapCalendarSummary(row));

        return {
            ...this.mapConnectionSummary(connectionRow),
            calendars,
        };
    }

    persistConnection(input: PersistGoogleConnectionInput): GoogleConnectionDetail {
        const timestamp = new Date().toISOString();
        const connectionId = `google:${input.externalAccountId}`;
        const existingConnection = this.client.db
            .select()
            .from(integrationConnectionsTable)
            .where(eq(integrationConnectionsTable.id, connectionId))
            .get();

        this.client.db
            .insert(integrationConnectionsTable)
            .values({
                id: connectionId,
                provider: 'google',
                externalAccountId: input.externalAccountId,
                email: input.email,
                displayName: input.displayName,
                avatarUrl: input.avatarUrl,
                credentialStorageMode: input.credentialStorageMode,
                secretRef: input.secretRef,
                accessToken: input.tokens?.accessToken ?? null,
                refreshToken: input.tokens?.refreshToken ?? null,
                tokenExpiresAt: input.tokens?.expiresAt ?? null,
                scopesJson: JSON.stringify(input.scopes),
                lastSyncStatus: existingConnection?.lastSyncStatus ?? 'idle',
                lastSyncError: existingConnection?.lastSyncError ?? null,
                lastSyncAt: existingConnection?.lastSyncAt ?? null,
                createdAt: existingConnection?.createdAt ?? timestamp,
                updatedAt: timestamp,
            })
            .onConflictDoUpdate({
                target: integrationConnectionsTable.id,
                set: {
                    avatarUrl: input.avatarUrl,
                    credentialStorageMode: input.credentialStorageMode,
                    secretRef: input.secretRef,
                    accessToken: input.tokens?.accessToken ?? null,
                    refreshToken: input.tokens?.refreshToken ?? null,
                    tokenExpiresAt: input.tokens?.expiresAt ?? null,
                    scopesJson: JSON.stringify(input.scopes),
                    email: input.email,
                    displayName: input.displayName,
                    updatedAt: timestamp,
                },
            })
            .run();

        for (const calendar of input.calendars) {
            const calendarId = `${connectionId}:${calendar.externalCalendarId}`;
            const existingCalendar = this.client.db
                .select()
                .from(integrationCalendarsTable)
                .where(eq(integrationCalendarsTable.id, calendarId))
                .get();

            this.client.db
                .insert(integrationCalendarsTable)
                .values({
                    id: calendarId,
                    connectionId,
                    externalCalendarId: calendar.externalCalendarId,
                    name: calendar.name,
                    description: null,
                    calendarType: calendar.calendarType,
                    accessRole: calendar.accessRole,
                    googleBackgroundColor: calendar.googleBackgroundColor,
                    googleForegroundColor: calendar.googleForegroundColor,
                    isPrimary: calendar.isPrimary,
                    isSelected: existingCalendar?.isSelected ?? true,
                    syncEnabled: existingCalendar?.syncEnabled ?? true,
                    syncIntervalMinutes: existingCalendar?.syncIntervalMinutes ?? 15,
                    reminderEnabled: existingCalendar?.reminderEnabled ?? false,
                    reminderChannel: existingCalendar?.reminderChannel ?? 'in_app',
                    reminderLeadMinutes: existingCalendar?.reminderLeadMinutes ?? 15,
                    colorOverride: existingCalendar?.colorOverride ?? null,
                    lastSyncStatus: existingCalendar?.lastSyncStatus ?? 'idle',
                    lastSyncError: existingCalendar?.lastSyncError ?? null,
                    lastSyncAt: existingCalendar?.lastSyncAt ?? null,
                    createdAt: existingCalendar?.createdAt ?? timestamp,
                    updatedAt: timestamp,
                })
                .onConflictDoUpdate({
                    target: integrationCalendarsTable.id,
                    set: {
                        name: calendar.name,
                        calendarType: calendar.calendarType,
                        accessRole: calendar.accessRole,
                        googleBackgroundColor: calendar.googleBackgroundColor,
                        googleForegroundColor: calendar.googleForegroundColor,
                        isPrimary: calendar.isPrimary,
                        updatedAt: timestamp,
                    },
                })
                .run();
        }

        return this.getConnectionDetail(connectionId)!;
    }

    updateCalendar(input: UpdateGoogleCalendarInput): GoogleCalendarSummary {
        const existingCalendar = this.client.db
            .select()
            .from(integrationCalendarsTable)
            .where(eq(integrationCalendarsTable.id, input.calendarId))
            .get();

        if (!existingCalendar) {
            throw new Error('Google calendar not found.');
        }

        this.client.db
            .update(integrationCalendarsTable)
            .set({
                ...(input.colorOverride !== undefined
                    ? { colorOverride: input.colorOverride }
                    : {}),
                ...(input.isSelected !== undefined ? { isSelected: input.isSelected } : {}),
                ...(input.reminderChannel !== undefined
                    ? { reminderChannel: input.reminderChannel }
                    : {}),
                ...(input.reminderEnabled !== undefined
                    ? { reminderEnabled: input.reminderEnabled }
                    : {}),
                ...(input.reminderLeadMinutes !== undefined
                    ? { reminderLeadMinutes: input.reminderLeadMinutes }
                    : {}),
                ...(input.syncEnabled !== undefined ? { syncEnabled: input.syncEnabled } : {}),
                ...(input.syncIntervalMinutes !== undefined
                    ? { syncIntervalMinutes: input.syncIntervalMinutes }
                    : {}),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(integrationCalendarsTable.id, input.calendarId))
            .run();

        return this.mapCalendarSummary(
            this.client.db
                .select()
                .from(integrationCalendarsTable)
                .where(eq(integrationCalendarsTable.id, input.calendarId))
                .get()!,
        );
    }

    disconnectConnection(connectionId: string): void {
        this.client.db
            .delete(integrationConnectionsTable)
            .where(eq(integrationConnectionsTable.id, connectionId))
            .run();
    }

    listSyncableCalendars(connectionId: string): IntegrationCalendarRow[] {
        return this.client.db
            .select()
            .from(integrationCalendarsTable)
            .where(eq(integrationCalendarsTable.connectionId, connectionId))
            .all()
            .filter((row) => row.isSelected && row.syncEnabled);
    }

    getConnectionRow(connectionId: string): IntegrationConnectionRow | null {
        return (
            this.client.db
                .select()
                .from(integrationConnectionsTable)
                .where(eq(integrationConnectionsTable.id, connectionId))
                .get() ?? null
        );
    }

    updateConnectionSyncState(
        connectionId: string,
        status: GoogleConnectionSummary['lastSyncStatus'],
        error: string | null,
    ): void {
        this.client.db
            .update(integrationConnectionsTable)
            .set({
                lastSyncAt: new Date().toISOString(),
                lastSyncError: error,
                lastSyncStatus: status,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(integrationConnectionsTable.id, connectionId))
            .run();
    }

    updateCalendarSyncState(
        calendarIds: string[],
        status: GoogleConnectionSummary['lastSyncStatus'],
        error: string | null,
    ): void {
        if (calendarIds.length === 0) {
            return;
        }

        this.client.db
            .update(integrationCalendarsTable)
            .set({
                lastSyncAt: new Date().toISOString(),
                lastSyncError: error,
                lastSyncStatus: status,
                updatedAt: new Date().toISOString(),
            })
            .where(inArray(integrationCalendarsTable.id, calendarIds))
            .run();
    }

    replaceCalendarEvents(calendarId: string, events: CalendarEventRow[]): void {
        const existing = this.client.db
            .select({ id: calendarEventsTable.id })
            .from(calendarEventsTable)
            .where(eq(calendarEventsTable.calendarId, calendarId))
            .all();

        if (existing.length > 0) {
            this.client.db
                .delete(calendarEventsTable)
                .where(
                    and(
                        eq(calendarEventsTable.calendarId, calendarId),
                        inArray(
                            calendarEventsTable.id,
                            existing.map((row) => row.id),
                        ),
                    ),
                )
                .run();
        }

        if (events.length > 0) {
            this.client.db.insert(calendarEventsTable).values(events).run();
        }
    }

    private mapConnectionSummary(row: IntegrationConnectionRow): GoogleConnectionSummary {
        const calendars = this.client.db
            .select({
                id: integrationCalendarsTable.id,
                isSelected: integrationCalendarsTable.isSelected,
            })
            .from(integrationCalendarsTable)
            .where(eq(integrationCalendarsTable.connectionId, row.id))
            .all();

        return {
            credentialStorageMode: row.credentialStorageMode,
            displayName: row.displayName,
            email: row.email,
            id: row.id,
            lastSyncAt: row.lastSyncAt,
            lastSyncError: row.lastSyncError,
            lastSyncStatus: row.lastSyncStatus,
            scopes: JSON.parse(row.scopesJson) as string[],
            selectedCalendarCount: calendars.filter((calendar) => calendar.isSelected).length,
        };
    }

    private mapCalendarSummary(row: IntegrationCalendarRow): GoogleCalendarSummary {
        return {
            accessRole: row.accessRole,
            colorOverride: row.colorOverride,
            connectionId: row.connectionId,
            effectiveColor: row.colorOverride ?? row.googleBackgroundColor ?? '#9ca3af',
            externalCalendarId: row.externalCalendarId,
            googleBackgroundColor: row.googleBackgroundColor,
            googleForegroundColor: row.googleForegroundColor,
            id: row.id,
            isPrimary: row.isPrimary,
            isSelected: row.isSelected,
            lastSyncAt: row.lastSyncAt,
            lastSyncError: row.lastSyncError,
            lastSyncStatus: row.lastSyncStatus,
            name: row.name,
            reminderChannel: row.reminderChannel,
            reminderEnabled: row.reminderEnabled,
            reminderLeadMinutes: GOOGLE_REMINDER_LEAD_OPTIONS.includes(
                row.reminderLeadMinutes as (typeof GOOGLE_REMINDER_LEAD_OPTIONS)[number],
            )
                ? (row.reminderLeadMinutes as GoogleCalendarSummary['reminderLeadMinutes'])
                : 15,
            syncEnabled: row.syncEnabled,
            syncIntervalMinutes: GOOGLE_SYNC_INTERVAL_OPTIONS.includes(
                row.syncIntervalMinutes as (typeof GOOGLE_SYNC_INTERVAL_OPTIONS)[number],
            )
                ? (row.syncIntervalMinutes as GoogleCalendarSummary['syncIntervalMinutes'])
                : 15,
            type: row.calendarType,
        };
    }
}
