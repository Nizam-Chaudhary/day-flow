import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createDatabaseClient } from '@/db/client';
import { GoogleRepository } from '@/db/google-repository';
import { runDatabaseMigrations } from '@/db/migrate';
import { calendarEventsTable } from '@/db/schema';

const migrationsFolder = join(process.cwd(), 'src', 'db', 'drizzle');
const cleanupPaths = new Set<string>();

afterEach(() => {
    for (const cleanupPath of cleanupPaths) {
        rmSync(cleanupPath, { force: true, recursive: true });
    }

    cleanupPaths.clear();
});

describe('GoogleRepository.replaceCalendarEvents', () => {
    it('stores matching external event ids across different calendars in one connection', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-google-repo-'));
        const databasePath = join(tempDirectory, 'google-repository.sqlite');
        const client = await createDatabaseClient({ databasePath });

        cleanupPaths.add(tempDirectory);

        await runDatabaseMigrations(client, migrationsFolder);

        const repository = new GoogleRepository(client);
        const connection = await repository.persistConnection({
            avatarUrl: null,
            calendars: [
                {
                    accessRole: 'owner',
                    calendarType: 'default',
                    externalCalendarId: 'primary',
                    googleBackgroundColor: '#1f2937',
                    googleForegroundColor: '#f9fafb',
                    isPrimary: true,
                    name: 'Primary',
                },
                {
                    accessRole: 'reader',
                    calendarType: 'holiday',
                    externalCalendarId: 'holidays',
                    googleBackgroundColor: '#2563eb',
                    googleForegroundColor: '#ffffff',
                    isPrimary: false,
                    name: 'Holidays',
                },
            ],
            credentialStorageMode: 'sqlite_plaintext',
            displayName: 'Test User',
            email: 'user@example.com',
            externalAccountId: 'account-1',
            scopes: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'],
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email https://www.googleapis.com/auth/calendar',
            },
        });

        const [primaryCalendar, holidaysCalendar] = connection.calendars;
        const timestamp = new Date().toISOString();

        await repository.replaceCalendarEvents(primaryCalendar.id, [
            {
                calendarId: primaryCalendar.id,
                connectionId: connection.id,
                createdAt: timestamp,
                description: null,
                endAt: '2026-04-21T10:00:00.000Z',
                etag: null,
                externalEventId: 'shared-event-id',
                htmlLink: null,
                id: `${primaryCalendar.id}:shared-event-id`,
                isAllDay: false,
                lastSyncedAt: timestamp,
                location: null,
                provider: 'google',
                rawUpdatedAt: timestamp,
                startAt: '2026-04-21T09:00:00.000Z',
                status: 'confirmed',
                timezone: 'UTC',
                title: 'Primary event',
                updatedAt: timestamp,
            },
        ]);

        await expect(
            repository.replaceCalendarEvents(holidaysCalendar.id, [
                {
                    calendarId: holidaysCalendar.id,
                    connectionId: connection.id,
                    createdAt: timestamp,
                    description: null,
                    endAt: '2026-04-21',
                    etag: null,
                    externalEventId: 'shared-event-id',
                    htmlLink: null,
                    id: `${holidaysCalendar.id}:shared-event-id`,
                    isAllDay: true,
                    lastSyncedAt: timestamp,
                    location: null,
                    provider: 'google',
                    rawUpdatedAt: timestamp,
                    startAt: '2026-04-21',
                    status: 'confirmed',
                    timezone: null,
                    title: 'Holiday event',
                    updatedAt: timestamp,
                },
            ]),
        ).resolves.toBeUndefined();

        await expect(client.db.select().from(calendarEventsTable).all()).resolves.toHaveLength(2);

        client.client.close();
    });

    it('still rejects duplicate external event ids within the same calendar', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-google-repo-'));
        const databasePath = join(tempDirectory, 'google-repository.sqlite');
        const client = await createDatabaseClient({ databasePath });

        cleanupPaths.add(tempDirectory);

        await runDatabaseMigrations(client, migrationsFolder);

        const repository = new GoogleRepository(client);
        const connection = await repository.persistConnection({
            avatarUrl: null,
            calendars: [
                {
                    accessRole: 'owner',
                    calendarType: 'default',
                    externalCalendarId: 'primary',
                    googleBackgroundColor: '#1f2937',
                    googleForegroundColor: '#f9fafb',
                    isPrimary: true,
                    name: 'Primary',
                },
            ],
            credentialStorageMode: 'sqlite_plaintext',
            displayName: 'Test User',
            email: 'user@example.com',
            externalAccountId: 'account-2',
            scopes: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'],
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email https://www.googleapis.com/auth/calendar',
            },
        });

        const [calendar] = connection.calendars;
        const timestamp = new Date().toISOString();

        await expect(
            client.db
                .insert(calendarEventsTable)
                .values([
                    {
                        calendarId: calendar.id,
                        connectionId: connection.id,
                        createdAt: timestamp,
                        description: null,
                        endAt: '2026-04-21T10:00:00.000Z',
                        etag: null,
                        externalEventId: 'shared-event-id',
                        htmlLink: null,
                        id: `${calendar.id}:shared-event-id:1`,
                        isAllDay: false,
                        lastSyncedAt: timestamp,
                        location: null,
                        provider: 'google',
                        rawUpdatedAt: timestamp,
                        startAt: '2026-04-21T09:00:00.000Z',
                        status: 'confirmed',
                        timezone: 'UTC',
                        title: 'Duplicate A',
                        updatedAt: timestamp,
                    },
                    {
                        calendarId: calendar.id,
                        connectionId: connection.id,
                        createdAt: timestamp,
                        description: null,
                        endAt: '2026-04-21T12:00:00.000Z',
                        etag: null,
                        externalEventId: 'shared-event-id',
                        htmlLink: null,
                        id: `${calendar.id}:shared-event-id:2`,
                        isAllDay: false,
                        lastSyncedAt: timestamp,
                        location: null,
                        provider: 'google',
                        rawUpdatedAt: timestamp,
                        startAt: '2026-04-21T11:00:00.000Z',
                        status: 'confirmed',
                        timezone: 'UTC',
                        title: 'Duplicate B',
                        updatedAt: timestamp,
                    },
                ])
                .run(),
        ).rejects.toThrow('Failed query');

        client.client.close();
    });
});

describe('GoogleRepository calendar color type', () => {
    it('defaults new calendars to curated and preserves saved color type on provider refresh', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-google-repo-'));
        const databasePath = join(tempDirectory, 'google-repository.sqlite');
        const client = await createDatabaseClient({ databasePath });

        cleanupPaths.add(tempDirectory);

        await runDatabaseMigrations(client, migrationsFolder);

        const repository = new GoogleRepository(client);
        const initialConnection = await repository.persistConnection({
            avatarUrl: null,
            calendars: [
                {
                    accessRole: 'owner',
                    calendarType: 'default',
                    externalCalendarId: 'primary',
                    googleBackgroundColor: '#1f2937',
                    googleForegroundColor: '#f9fafb',
                    isPrimary: true,
                    name: 'Primary',
                },
            ],
            credentialStorageMode: 'sqlite_plaintext',
            displayName: 'Test User',
            email: 'user@example.com',
            externalAccountId: 'account-3',
            scopes: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'],
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email https://www.googleapis.com/auth/calendar',
            },
        });

        expect(initialConnection.calendars[0]?.calendarColorType).toBe('curated');

        await repository.updateCalendar({
            calendarColorType: 'custom',
            calendarId: initialConnection.calendars[0]!.id,
            colorOverride: '#22c55e',
        });

        const refreshedConnection = await repository.persistConnection({
            avatarUrl: null,
            calendars: [
                {
                    accessRole: 'owner',
                    calendarType: 'default',
                    externalCalendarId: 'primary',
                    googleBackgroundColor: '#2563eb',
                    googleForegroundColor: '#ffffff',
                    isPrimary: true,
                    name: 'Primary calendar',
                },
            ],
            credentialStorageMode: 'sqlite_plaintext',
            displayName: 'Test User',
            email: 'user@example.com',
            externalAccountId: 'account-3',
            scopes: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'],
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email https://www.googleapis.com/auth/calendar',
            },
        });

        expect(refreshedConnection.calendars[0]).toMatchObject({
            calendarColorType: 'custom',
            colorOverride: '#22c55e',
            effectiveColor: '#22c55e',
            name: 'Primary calendar',
        });

        client.client.close();
    });

    it('persists calendarColorType updates', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-google-repo-'));
        const databasePath = join(tempDirectory, 'google-repository.sqlite');
        const client = await createDatabaseClient({ databasePath });

        cleanupPaths.add(tempDirectory);

        await runDatabaseMigrations(client, migrationsFolder);

        const repository = new GoogleRepository(client);
        const connection = await repository.persistConnection({
            avatarUrl: null,
            calendars: [
                {
                    accessRole: 'owner',
                    calendarType: 'default',
                    externalCalendarId: 'primary',
                    googleBackgroundColor: '#1a73e8',
                    googleForegroundColor: '#ffffff',
                    isPrimary: true,
                    name: 'Primary',
                },
            ],
            credentialStorageMode: 'sqlite_plaintext',
            displayName: 'Test User',
            email: 'user@example.com',
            externalAccountId: 'account-4',
            scopes: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'],
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email https://www.googleapis.com/auth/calendar',
            },
        });

        await expect(
            repository.updateCalendar({
                calendarColorType: 'custom',
                calendarId: connection.calendars[0]!.id,
                colorOverride: '#0f172a',
            }),
        ).resolves.toMatchObject({
            calendarColorType: 'custom',
            colorOverride: '#0f172a',
            effectiveColor: '#0f172a',
        });

        client.client.close();
    });
});
