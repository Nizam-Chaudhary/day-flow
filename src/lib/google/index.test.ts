import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    GoogleEventListResponse,
    GoogleOAuthTokenSet,
} from '@/schemas/contracts/google-calendar';

import { createDatabaseClient } from '@/db/client';
import { GoogleRepository } from '@/db/google-repository';
import { runDatabaseMigrations } from '@/db/migrate';
import { calendarEventsTable } from '@/db/schema';

import { GoogleCalendarSyncService, GoogleTokenStore } from './index';

const migrationsFolder = join(process.cwd(), 'src', 'db', 'drizzle');
const cleanupPaths = new Set<string>();

afterEach(() => {
    for (const cleanupPath of cleanupPaths) {
        rmSync(cleanupPath, { force: true, recursive: true });
    }

    cleanupPaths.clear();
});

describe('GoogleTokenStore', () => {
    it('falls back to sqlite plaintext when keychain is unavailable', async () => {
        const tokenStore = new GoogleTokenStore(null);

        await expect(
            tokenStore.store('google:user-1', {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email',
            }),
        ).resolves.toEqual({
            credentialStorageMode: 'sqlite_plaintext',
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email',
            },
        });
    });

    it('stores credentials in keychain when available', async () => {
        const setPassword = vi.fn<
            (service: string, account: string, password: string) => Promise<void>
        >(async () => {});
        const tokenStore = new GoogleTokenStore({
            deletePassword: vi.fn<(service: string, account: string) => Promise<boolean>>(),
            getPassword: vi.fn<(service: string, account: string) => Promise<string | null>>(),
            setPassword,
        });

        const result = await tokenStore.store('google:user-1', {
            accessToken: 'access-token',
            expiresAt: null,
            refreshToken: 'refresh-token',
            scope: 'openid email',
        });

        expect(setPassword).toHaveBeenCalledTimes(1);
        expect(result.credentialStorageMode).toBe('keychain');
        expect(result.tokens).toBeNull();
    });
});

describe('GoogleCalendarSyncService', () => {
    it('skips calendars that are not due yet', () => {
        const service = new GoogleCalendarSyncService({} as never, {} as never, {} as never);

        expect(
            service.shouldSyncCalendar({
                lastSyncAt: new Date().toISOString(),
                syncEnabled: true,
                syncIntervalMinutes: 60,
            }),
        ).toBe(false);
    });

    it('allows sync for unsynced calendars', () => {
        const service = new GoogleCalendarSyncService({} as never, {} as never, {} as never);

        expect(
            service.shouldSyncCalendar({
                lastSyncAt: null,
                syncEnabled: true,
                syncIntervalMinutes: 60,
            }),
        ).toBe(true);
    });

    it('syncs overlapping event ids from different calendars under one connection', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-google-sync-'));
        const databasePath = join(tempDirectory, 'google-sync.sqlite');
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
            externalAccountId: 'sync-account',
            scopes: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'],
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email https://www.googleapis.com/auth/calendar',
            },
        });

        const listEvents = vi.fn<
            (accessToken: string, calendarId: string) => Promise<GoogleEventListResponse>
        >(async (_accessToken: string, calendarId: string) => {
            if (calendarId === 'primary') {
                return {
                    items: [
                        {
                            end: { dateTime: '2026-04-21T10:00:00.000Z', timeZone: 'UTC' },
                            htmlLink: 'https://example.com/primary',
                            id: 'shared-event-id',
                            start: { dateTime: '2026-04-21T09:00:00.000Z', timeZone: 'UTC' },
                            status: 'confirmed',
                            summary: 'Primary event',
                            updated: '2026-04-20T18:29:45.600Z',
                        },
                    ],
                };
            }

            return {
                items: [
                    {
                        end: { date: '2026-04-22' },
                        htmlLink: 'https://example.com/holiday',
                        id: 'shared-event-id',
                        start: { date: '2026-04-21' },
                        status: 'confirmed',
                        summary: 'Holiday event',
                        updated: '2026-04-20T18:29:45.600Z',
                    },
                ],
            };
        });

        const service = new GoogleCalendarSyncService(
            repository,
            {
                listEvents,
            } as never,
            {
                load: vi.fn<() => Promise<GoogleOAuthTokenSet>>(async () => ({
                    accessToken: 'access-token',
                    expiresAt: null,
                    refreshToken: 'refresh-token',
                    scope: 'openid email https://www.googleapis.com/auth/calendar',
                })),
            } as never,
        );

        await expect(service.syncConnection(connection.id)).resolves.toMatchObject({
            id: connection.id,
            lastSyncStatus: 'success',
        });

        await expect(client.db.select().from(calendarEventsTable).all()).resolves.toHaveLength(2);
        expect(listEvents).toHaveBeenCalledTimes(2);

        client.client.close();
    });
});
