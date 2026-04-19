import type {
    GoogleConnectionDetail,
    StartGoogleConnectionResult,
    UpdateGoogleCalendarInput,
    UpdateGoogleConnectionInput,
} from '@day-flow/contracts/google-calendar';

import { createDayFlowError, normalizeDayFlowError } from '@day-flow/contracts/errors';
import { getOrCreateDatabaseClient, type DatabaseClient } from '@day-flow/db/client';
import {
    GoogleCalendarCatalogService,
    GoogleCalendarSyncService,
    GoogleConnectionService,
    GoogleOAuthService,
    GoogleTokenStore,
    type GoogleKeychainAdapter,
} from '@day-flow/integrations-google/index';
import { shell } from 'electron';
import { createRequire } from 'node:module';

import type { AuthServerRuntime } from '@/main/auth/auth-server-process-manager';

import { getDatabasePath } from '@/main/db/paths';

const FLOW_POLL_INTERVAL_MS = 1000;
const FLOW_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const BACKGROUND_SYNC_TICK_MS = 60 * 1000;

interface CreateGoogleCalendarServiceOptions {
    authServerRuntime?: AuthServerRuntime;
    client?: DatabaseClient | Promise<DatabaseClient>;
    fetchImpl?: typeof fetch;
    keychain?: GoogleKeychainAdapter | null;
    openExternal?: typeof shell.openExternal;
    oauthClientId?: string;
    oauthClientSecret?: string;
}

export interface GoogleCalendarService {
    disconnectConnection(connectionId: string): Promise<void>;
    getConnectionDetail(connectionId: string): Promise<GoogleConnectionDetail>;
    listConnections(): Promise<GoogleConnectionDetail[]>;
    startConnection(): Promise<StartGoogleConnectionResult>;
    syncConnection(connectionId: string): Promise<GoogleConnectionDetail>;
    updateCalendar(input: UpdateGoogleCalendarInput): Promise<GoogleConnectionDetail>;
    updateConnection(input: UpdateGoogleConnectionInput): Promise<GoogleConnectionDetail>;
}

let googleCalendarService: GoogleCalendarService | undefined;

export function createGoogleCalendarService({
    authServerRuntime,
    client = getOrCreateDatabaseClient(getDatabasePath()),
    fetchImpl = fetch,
    keychain = null,
    openExternal = (url) => shell.openExternal(url),
    oauthClientId = process.env.GOOGLE_CLIENT_ID,
    oauthClientSecret = process.env.GOOGLE_CLIENT_SECRET,
}: CreateGoogleCalendarServiceOptions = {}): GoogleCalendarService {
    if (!oauthClientId || !oauthClientSecret) {
        return createUnavailableGoogleCalendarService();
    }

    const oauthService = new GoogleOAuthService(
        {
            clientId: oauthClientId,
            clientSecret: oauthClientSecret,
        },
        fetchImpl,
    );
    const tokenStore = new GoogleTokenStore(keychain);
    let connectionRuntimePromise:
        | Promise<{
              connectionService: GoogleConnectionService;
              syncService: GoogleCalendarSyncService;
          }>
        | undefined;

    let authServerPromise:
        | Promise<Awaited<ReturnType<AuthServerRuntime['ensureStarted']>>>
        | undefined;

    const ensureAuthServer = () => {
        if (!authServerRuntime) {
            throw createDayFlowError('AUTH_ERROR', 'Auth server runtime is not available.');
        }

        authServerPromise ??= authServerRuntime.ensureStarted();

        return authServerPromise;
    };

    const getConnectionRuntime = async () => {
        connectionRuntimePromise ??= (async () => {
            const repository = new (
                await import('@day-flow/db/google-repository')
            ).GoogleRepository(await client);
            const syncService = new GoogleCalendarSyncService(repository, oauthService, tokenStore);
            const connectionService = new GoogleConnectionService(
                repository,
                oauthService,
                tokenStore,
                new GoogleCalendarCatalogService(),
                syncService,
            );

            return {
                connectionService,
                syncService,
            };
        })();

        return await connectionRuntimePromise;
    };

    const runDueSyncs = async () => {
        const { connectionService, syncService } = await getConnectionRuntime();
        const connections = await connectionService.listConnections();

        for (const connection of connections) {
            const detail = await connectionService.getConnectionDetail(connection.id);
            const hasDueCalendar = detail.calendars.some((calendar) =>
                syncService.shouldSyncCalendar(calendar),
            );

            if (hasDueCalendar) {
                await syncService.syncConnection(connection.id);
            }
        }
    };

    const syncInterval = setInterval(() => {
        void runDueSyncs().catch(() => {});
    }, BACKGROUND_SYNC_TICK_MS);
    syncInterval.unref?.();

    return {
        async disconnectConnection(connectionId) {
            const { connectionService } = await getConnectionRuntime();
            await connectionService.disconnectConnection(connectionId);
        },
        async getConnectionDetail(connectionId) {
            const { connectionService } = await getConnectionRuntime();

            return await connectionService.getConnectionDetail(connectionId);
        },
        async listConnections() {
            const { connectionService } = await getConnectionRuntime();
            const connections = await connectionService.listConnections();

            return await Promise.all(
                connections.map(async (connection) => {
                    return await connectionService.getConnectionDetail(connection.id);
                }),
            );
        },
        async startConnection() {
            try {
                const { connectionService } = await getConnectionRuntime();
                const authServer = await ensureAuthServer();
                const flowResponse = await fetchImpl(`${authServer.baseUrl}/oauth/google/flows`, {
                    body: JSON.stringify({
                        clientId: oauthClientId,
                        scopes: oauthService.getScopes(),
                    }),
                    headers: {
                        'content-type': 'application/json',
                    },
                    method: 'POST',
                });

                if (!flowResponse.ok) {
                    throw createDayFlowError(
                        'AUTH_ERROR',
                        'Failed to initialize the Google authorization flow.',
                    );
                }

                const flow = (await flowResponse.json()) as {
                    authUrl: string;
                    codeVerifier: string;
                    expiresAt: string;
                    flowId: string;
                    redirectUri: string;
                };

                await openExternal(flow.authUrl);

                const result = await pollForGoogleFlowCompletion({
                    baseUrl: authServer.baseUrl,
                    fetchImpl,
                    flowId: flow.flowId,
                });

                if (result.status !== 'completed' || !result.code) {
                    throw createDayFlowError(
                        'AUTH_ERROR',
                        result.errorDescription ??
                            result.error ??
                            'Google authorization was cancelled or failed.',
                    );
                }

                const detail = await connectionService.completeConnection({
                    code: result.code,
                    codeVerifier: flow.codeVerifier,
                    redirectUri: flow.redirectUri,
                });

                return {
                    authUrl: flow.authUrl,
                    connectionId: detail.id,
                    email: detail.email,
                    flowId: flow.flowId,
                };
            } catch (error) {
                throw normalizeDayFlowError(error, 'AUTH_ERROR');
            }
        },
        async syncConnection(connectionId) {
            const { syncService } = await getConnectionRuntime();

            return await syncService.syncConnection(connectionId);
        },
        async updateCalendar(input) {
            const { connectionService } = await getConnectionRuntime();
            const calendar = await connectionService.updateCalendar(input);

            return await connectionService.getConnectionDetail(calendar.connectionId);
        },
        async updateConnection(input) {
            const { connectionService } = await getConnectionRuntime();

            return await connectionService.updateConnection(input.connectionId);
        },
    };
}

export function getGoogleCalendarService({
    authServerRuntime,
    client,
}: {
    authServerRuntime?: AuthServerRuntime;
    client?: DatabaseClient | Promise<DatabaseClient>;
} = {}): GoogleCalendarService {
    googleCalendarService ??= createGoogleCalendarService({
        authServerRuntime,
        client,
        keychain: getKeychainAdapter(),
    });

    return googleCalendarService;
}

function createUnavailableGoogleCalendarService(): GoogleCalendarService {
    const fail = () => {
        throw createDayFlowError(
            'AUTH_ERROR',
            'Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        );
    };

    return {
        disconnectConnection: async () => fail(),
        getConnectionDetail: async () => fail(),
        listConnections: async () => [],
        startConnection: async () => fail(),
        syncConnection: async () => fail(),
        updateCalendar: async () => fail(),
        updateConnection: async () => fail(),
    };
}

async function pollForGoogleFlowCompletion({
    baseUrl,
    fetchImpl,
    flowId,
}: {
    baseUrl: string;
    fetchImpl: typeof fetch;
    flowId: string;
}) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < FLOW_POLL_TIMEOUT_MS) {
        const response = await fetchImpl(`${baseUrl}/oauth/google/flows/${flowId}`);

        if (!response.ok && response.status !== 410) {
            throw createDayFlowError('AUTH_ERROR', 'Google authorization polling failed.');
        }

        const result = (await response.json()) as {
            code?: string;
            error?: string;
            errorDescription?: string;
            status: 'completed' | 'failed' | 'pending';
        };

        if (result.status !== 'pending') {
            return result;
        }

        await new Promise((resolve) => {
            setTimeout(resolve, FLOW_POLL_INTERVAL_MS);
        });
    }

    throw createDayFlowError('AUTH_ERROR', 'Google authorization timed out.');
}

function getKeychainAdapter(): GoogleKeychainAdapter | null {
    try {
        const require = createRequire(import.meta.url);
        const keytar = require('keytar') as GoogleKeychainAdapter;

        return keytar;
    } catch {
        return null;
    }
}
