import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryConstructor = vi.fn<(client: unknown) => void>();
const listConnections = vi.fn<() => Promise<Array<{ id: string }>>>(async () => []);
const listEvents = vi
    .fn<
        (input: {
            rangeEnd: string;
            rangeStart: string;
        }) => Promise<Array<{ id: string; title: string }>>
    >()
    .mockResolvedValue([]);
const getConnectionDetail = vi.fn<(connectionId: string) => Promise<{ connectionId: string }>>();
const completeConnection = vi.fn<
    (input: { code: string; codeVerifier: string; redirectUri: string }) => Promise<{
        email: string;
        id: string;
    }>
>();
const updateCalendar =
    vi.fn<(input: { calendarId: string }) => Promise<{ connectionId: string }>>();
const updateConnection = vi.fn<(connectionId: string) => Promise<never>>();
const disconnectConnection = vi.fn<(connectionId: string) => Promise<void>>();
const shouldSyncCalendar = vi.fn<(calendar: unknown) => boolean>(() => false);
const syncConnection = vi.fn<(connectionId: string) => Promise<never>>();

vi.mock('@/lib/env', () => ({
    env: {
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
    },
}));

vi.mock('@/db/client', () => ({
    getOrCreateDatabaseClient: vi.fn<
        () => Promise<{ client: object; databasePath: string; databaseUrl: string; db: object }>
    >(async () => ({
        client: {},
        databasePath: '/tmp/day-flow-test.sqlite',
        databaseUrl: 'file:/tmp/day-flow-test.sqlite',
        db: {},
    })),
}));

vi.mock('@/db/google-repository', () => ({
    GoogleRepository: class {
        constructor(client: unknown) {
            repositoryConstructor(client);
        }
    },
}));

vi.mock('@/lib/google', () => ({
    GoogleCalendarCatalogService: class {},
    GoogleCalendarSyncService: class {
        shouldSyncCalendar = shouldSyncCalendar;
        syncConnection = syncConnection;
    },
    GoogleConnectionService: class {
        listConnections = listConnections;
        listEvents = listEvents;
        getConnectionDetail = getConnectionDetail;
        completeConnection = completeConnection;
        updateCalendar = updateCalendar;
        updateConnection = updateConnection;
        disconnectConnection = disconnectConnection;
    },
    GoogleOAuthService: class {
        getScopes() {
            return ['openid', 'email'];
        }
    },
    GoogleTokenStore: class {},
}));

import { createGoogleCalendarService } from '@/main/google-calendar';

beforeEach(() => {
    vi.clearAllMocks();

    getConnectionDetail.mockImplementation(async (connectionId) => ({
        connectionId,
    }));
    completeConnection.mockResolvedValue({
        email: 'user@example.com',
        id: 'google:user-1',
    });
    updateCalendar.mockImplementation(async ({ calendarId }) => ({
        connectionId: `connection-for:${calendarId}`,
    }));
    disconnectConnection.mockResolvedValue(undefined);
    listEvents.mockResolvedValue([]);
    shouldSyncCalendar.mockReturnValue(false);
});

describe('createGoogleCalendarService', () => {
    it('starts the auth server lazily when starting a Google connection', async () => {
        const ensureStarted = vi.fn<() => Promise<{ baseUrl: string; port: number }>>(async () => ({
            baseUrl: 'http://127.0.0.1:8787',
            port: 8787,
        }));
        const openExternal = vi
            .fn<typeof import('electron').shell.openExternal>()
            .mockResolvedValue(undefined);
        const fetchImpl = vi.fn<typeof fetch>(async (input) => {
            const url =
                input instanceof URL
                    ? input.toString()
                    : input instanceof Request
                      ? input.url
                      : input;

            if (url === 'http://127.0.0.1:8787/oauth/google/flows') {
                return new Response(
                    JSON.stringify({
                        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=flow-state',
                        codeVerifier: 'code-verifier',
                        expiresAt: '2026-04-19T00:10:00.000Z',
                        flowId: 'flow-id',
                        redirectUri: 'http://127.0.0.1:8787/oauth/google/callback',
                    }),
                    { status: 200 },
                );
            }

            if (url === 'http://127.0.0.1:8787/oauth/google/flows/flow-id') {
                return new Response(
                    JSON.stringify({
                        code: 'auth-code',
                        expiresAt: '2026-04-19T00:10:00.000Z',
                        flowId: 'flow-id',
                        status: 'completed',
                    }),
                    { status: 200 },
                );
            }

            throw new Error(`Unexpected fetch request: ${url}`);
        });
        const service = createGoogleCalendarService({
            authServerRuntime: {
                ensureStarted,
                stop: vi.fn<() => Promise<void>>(async () => undefined),
            },
            client: {
                client: {} as never,
                databasePath: '/tmp/day-flow-test.sqlite',
                databaseUrl: 'file:/tmp/day-flow-test.sqlite',
                db: {} as never,
            },
            fetchImpl,
            keychain: null,
            oauthClientId: 'google-client-id',
            oauthClientSecret: 'google-client-secret',
            openExternal,
        });

        expect(ensureStarted).not.toHaveBeenCalled();

        await expect(service.startConnection()).resolves.toEqual({
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=flow-state',
            connectionId: 'google:user-1',
            email: 'user@example.com',
            flowId: 'flow-id',
        });

        expect(ensureStarted).toHaveBeenCalledTimes(1);
        expect(openExternal).toHaveBeenCalledWith(
            'https://accounts.google.com/o/oauth2/v2/auth?state=flow-state',
        );
        expect(completeConnection).toHaveBeenCalledWith({
            code: 'auth-code',
            codeVerifier: 'code-verifier',
            redirectUri: 'http://127.0.0.1:8787/oauth/google/callback',
        });
    });

    it('normalizes auth server startup failures as auth errors', async () => {
        const service = createGoogleCalendarService({
            authServerRuntime: {
                ensureStarted: vi.fn<() => Promise<{ baseUrl: string; port: number }>>(async () => {
                    throw new Error('Auth child failed to boot.');
                }),
                stop: vi.fn<() => Promise<void>>(async () => undefined),
            },
            client: {
                client: {} as never,
                databasePath: '/tmp/day-flow-test.sqlite',
                databaseUrl: 'file:/tmp/day-flow-test.sqlite',
                db: {} as never,
            },
            fetchImpl: vi.fn<typeof fetch>(),
            keychain: null,
            oauthClientId: 'google-client-id',
            oauthClientSecret: 'google-client-secret',
            openExternal: vi
                .fn<typeof import('electron').shell.openExternal>()
                .mockResolvedValue(undefined),
        });

        await expect(service.startConnection()).rejects.toEqual({
            code: 'AUTH_ERROR',
            message: 'Auth child failed to boot.',
        });
    });

    it('passes calendar color type through updateCalendar', async () => {
        const service = createGoogleCalendarService({
            client: {
                client: {} as never,
                databasePath: '/tmp/day-flow-test.sqlite',
                databaseUrl: 'file:/tmp/day-flow-test.sqlite',
                db: {} as never,
            },
            fetchImpl: vi.fn<typeof fetch>(),
            keychain: null,
            oauthClientId: 'google-client-id',
            oauthClientSecret: 'google-client-secret',
            openExternal: vi
                .fn<typeof import('electron').shell.openExternal>()
                .mockResolvedValue(undefined),
        });

        await expect(
            service.updateCalendar({
                calendarColorType: 'custom',
                calendarId: 'google:user-1:primary',
            }),
        ).resolves.toEqual({
            connectionId: 'connection-for:google:user-1:primary',
        });

        expect(updateCalendar).toHaveBeenCalledWith({
            calendarColorType: 'custom',
            calendarId: 'google:user-1:primary',
        });
    });

    it('passes range input through listEvents', async () => {
        listEvents.mockResolvedValue([{ id: 'event-1', title: 'Standup' }]);

        const service = createGoogleCalendarService({
            client: {
                client: {} as never,
                databasePath: '/tmp/day-flow-test.sqlite',
                databaseUrl: 'file:/tmp/day-flow-test.sqlite',
                db: {} as never,
            },
            fetchImpl: vi.fn<typeof fetch>(),
            keychain: null,
            oauthClientId: 'google-client-id',
            oauthClientSecret: 'google-client-secret',
            openExternal: vi
                .fn<typeof import('electron').shell.openExternal>()
                .mockResolvedValue(undefined),
        });

        await expect(
            service.listEvents({
                rangeEnd: '2026-04-25',
                rangeStart: '2026-04-24',
            }),
        ).resolves.toEqual([{ id: 'event-1', title: 'Standup' }]);

        expect(listEvents).toHaveBeenCalledWith({
            rangeEnd: '2026-04-25',
            rangeStart: '2026-04-24',
        });
    });
});
