import type { CalendarEventRow, IntegrationConnectionRow } from '@/db/schema';
import type {
    GoogleCalendarEvent,
    GoogleCalendarListEventsInput,
    GoogleCalendarListResponse,
    GoogleCalendarSummary,
    GoogleConnectionDetail,
    GoogleConnectionSummary,
    GoogleEventListResponse,
    GoogleOAuthTokenSet,
    UpdateGoogleCalendarInput,
} from '@/schemas/contracts/google-calendar';

import { GoogleRepository, type PersistGoogleConnectionInput } from '@/db/google-repository';
import { createDayFlowError } from '@/schemas/contracts/errors';

const GOOGLE_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar',
] as const;

type FetchLike = (
    input: string,
    init?: {
        body?: string;
        headers?: Record<string, string>;
        method?: string;
    },
) => Promise<{
    json(): Promise<unknown>;
    ok: boolean;
}>;

export interface GoogleKeychainAdapter {
    deletePassword(service: string, account: string): Promise<boolean>;
    getPassword(service: string, account: string): Promise<string | null>;
    setPassword(service: string, account: string, password: string): Promise<void>;
}

export interface GoogleTokenStoreResult {
    credentialStorageMode: GoogleConnectionSummary['credentialStorageMode'];
    secretRef: string | null;
    tokens: GoogleOAuthTokenSet | null;
}

export interface GoogleOAuthClientConfig {
    clientId: string;
    clientSecret?: string;
}

export interface GoogleOAuthFlowStartResult {
    authUrl: string;
    codeVerifier: string;
    expiresAt: string;
    flowId: string;
    redirectUri: string;
    state: string;
}

export interface GoogleOAuthFlowPollResult {
    code?: string;
    error?: string;
    errorDescription?: string;
    expiresAt: string;
    flowId: string;
    status: 'completed' | 'failed' | 'pending';
}

export interface GoogleOAuthProfile {
    email: string;
    id: string;
    name: string;
    picture?: string;
}

export class GoogleTokenStore {
    constructor(private readonly keychain: GoogleKeychainAdapter | null) {}

    async store(
        connectionId: string,
        tokens: GoogleOAuthTokenSet,
    ): Promise<GoogleTokenStoreResult> {
        if (!this.keychain) {
            return {
                credentialStorageMode: 'sqlite_plaintext',
                secretRef: null,
                tokens,
            };
        }

        try {
            const service = buildTokenServiceName(connectionId);

            await this.keychain.setPassword(service, connectionId, JSON.stringify(tokens));

            return {
                credentialStorageMode: 'keychain',
                secretRef: service,
                tokens: null,
            };
        } catch {
            return {
                credentialStorageMode: 'sqlite_plaintext',
                secretRef: null,
                tokens,
            };
        }
    }

    async load(connection: IntegrationConnectionRow): Promise<GoogleOAuthTokenSet> {
        if (connection.credentialStorageMode === 'sqlite_plaintext') {
            if (!connection.accessToken) {
                throw createDayFlowError(
                    'AUTH_ERROR',
                    'Google credentials are missing for the selected account.',
                );
            }

            return {
                accessToken: connection.accessToken,
                expiresAt: connection.tokenExpiresAt,
                refreshToken: connection.refreshToken,
                scope: connection.scopesJson,
            };
        }

        if (!this.keychain || !connection.secretRef) {
            throw createDayFlowError(
                'AUTH_ERROR',
                'Secure system credential storage is unavailable for this Google account.',
            );
        }

        const value = await this.keychain.getPassword(connection.secretRef, connection.id);

        if (!value) {
            throw createDayFlowError(
                'AUTH_ERROR',
                'Stored Google credentials could not be loaded.',
            );
        }

        return JSON.parse(value) as GoogleOAuthTokenSet;
    }

    async clear(connection: IntegrationConnectionRow): Promise<void> {
        if (
            !this.keychain ||
            connection.credentialStorageMode !== 'keychain' ||
            !connection.secretRef
        ) {
            return;
        }

        await this.keychain.deletePassword(connection.secretRef, connection.id);
    }
}

export class GoogleOAuthService {
    constructor(
        private readonly config: GoogleOAuthClientConfig,
        private readonly fetchImpl: FetchLike,
    ) {}

    getScopes(): string[] {
        return [...GOOGLE_SCOPES];
    }

    async exchangeCodeForTokens({
        code,
        codeVerifier,
        redirectUri,
    }: {
        code: string;
        codeVerifier: string;
        redirectUri: string;
    }): Promise<GoogleOAuthTokenSet> {
        const response = await this.fetchImpl('https://oauth2.googleapis.com/token', {
            body: buildUrlEncodedBody({
                client_id: this.config.clientId,
                code,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                ...(this.config.clientSecret
                    ? {
                          client_secret: this.config.clientSecret,
                      }
                    : {}),
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
        });

        if (!response.ok) {
            throw createDayFlowError('AUTH_ERROR', 'Google token exchange failed.');
        }

        const payload = (await response.json()) as {
            access_token: string;
            expires_in?: number;
            refresh_token?: string;
            scope: string;
        };

        return {
            accessToken: payload.access_token,
            expiresAt: payload.expires_in
                ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
                : null,
            refreshToken: payload.refresh_token ?? null,
            scope: payload.scope,
        };
    }

    async getProfile(accessToken: string): Promise<GoogleOAuthProfile> {
        const response = await this.fetchImpl('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw createDayFlowError('AUTH_ERROR', 'Failed to load Google profile.');
        }

        return (await response.json()) as GoogleOAuthProfile;
    }

    async listCalendars(accessToken: string): Promise<GoogleCalendarListResponse> {
        const response = await this.fetchImpl(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (!response.ok) {
            throw createDayFlowError('INTEGRATION_ERROR', 'Failed to load Google calendars.');
        }

        return (await response.json()) as GoogleCalendarListResponse;
    }

    async listEvents(accessToken: string, calendarId: string): Promise<GoogleEventListResponse> {
        const url = buildGoogleEventsUrl(calendarId);

        const response = await this.fetchImpl(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw createDayFlowError('INTEGRATION_ERROR', 'Failed to load Google events.');
        }

        return (await response.json()) as GoogleEventListResponse;
    }
}

export class GoogleCalendarCatalogService {
    mapCatalog(input: GoogleCalendarListResponse) {
        return input.items.map((calendar) => ({
            accessRole: normalizeAccessRole(calendar.accessRole),
            calendarType: inferCalendarType(calendar.id, calendar.summary),
            externalCalendarId: calendar.id,
            googleBackgroundColor: calendar.backgroundColor ?? null,
            googleForegroundColor: calendar.foregroundColor ?? null,
            isPrimary: Boolean(calendar.primary),
            name: calendar.summaryOverride ?? calendar.summary,
        }));
    }
}

export class GoogleCalendarWriteService {
    async createEvent(): Promise<never> {
        throw createDayFlowError(
            'INTEGRATION_ERROR',
            'Google Calendar write-back is not implemented in the renderer yet.',
        );
    }

    async updateEvent(): Promise<never> {
        throw createDayFlowError(
            'INTEGRATION_ERROR',
            'Google Calendar write-back is not implemented in the renderer yet.',
        );
    }

    async deleteEvent(): Promise<never> {
        throw createDayFlowError(
            'INTEGRATION_ERROR',
            'Google Calendar write-back is not implemented in the renderer yet.',
        );
    }
}

export class GoogleCalendarSyncService {
    constructor(
        private readonly repository: GoogleRepository,
        private readonly oauthService: GoogleOAuthService,
        private readonly tokenStore: GoogleTokenStore,
    ) {}

    async syncConnection(connectionId: string): Promise<GoogleConnectionDetail> {
        const connection = await this.repository.getConnectionRow(connectionId);

        if (!connection) {
            throw createDayFlowError('NOT_FOUND', 'Google account not found.');
        }

        const syncableCalendars = await this.repository.listSyncableCalendars(connectionId);
        const tokens = await this.tokenStore.load(connection);

        try {
            for (const calendar of syncableCalendars) {
                const events = await this.oauthService.listEvents(
                    tokens.accessToken,
                    calendar.externalCalendarId,
                );
                const timestamp = new Date().toISOString();

                await this.repository.replaceCalendarEvents(
                    calendar.id,
                    events.items.map((event) =>
                        mapEventToRow({
                            calendarId: calendar.id,
                            connectionId,
                            event,
                            timestamp,
                        }),
                    ),
                );
            }

            await this.repository.updateCalendarSyncState(
                syncableCalendars.map((calendar) => calendar.id),
                'success',
                null,
            );
            await this.repository.updateConnectionSyncState(connectionId, 'success', null);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Google Calendar sync failed unexpectedly.';

            await this.repository.updateCalendarSyncState(
                syncableCalendars.map((calendar) => calendar.id),
                'error',
                message,
            );
            await this.repository.updateConnectionSyncState(connectionId, 'error', message);
            throw error;
        }

        const detail = await this.repository.getConnectionDetail(connectionId);

        if (!detail) {
            throw createDayFlowError('NOT_FOUND', 'Google account not found after sync.');
        }

        return detail;
    }

    shouldSyncCalendar(calendar: {
        lastSyncAt: string | null;
        syncIntervalMinutes: number;
        syncEnabled: boolean;
    }): boolean {
        if (!calendar.syncEnabled) {
            return false;
        }

        if (!calendar.lastSyncAt) {
            return true;
        }

        return (
            Date.now() - new Date(calendar.lastSyncAt).getTime() >=
            calendar.syncIntervalMinutes * 60 * 1000
        );
    }
}

export class GoogleConnectionService {
    constructor(
        private readonly repository: GoogleRepository,
        private readonly oauthService: GoogleOAuthService,
        private readonly tokenStore: GoogleTokenStore,
        private readonly calendarCatalogService: GoogleCalendarCatalogService,
        private readonly syncService: GoogleCalendarSyncService,
    ) {}

    async listConnections(): Promise<GoogleConnectionSummary[]> {
        return await this.repository.listConnections();
    }

    async getConnectionDetail(connectionId: string): Promise<GoogleConnectionDetail> {
        const detail = await this.repository.getConnectionDetail(connectionId);

        if (!detail) {
            throw createDayFlowError('NOT_FOUND', 'Google account not found.');
        }

        return detail;
    }

    async completeConnection({
        code,
        codeVerifier,
        redirectUri,
    }: {
        code: string;
        codeVerifier: string;
        redirectUri: string;
    }): Promise<GoogleConnectionDetail> {
        const tokens = await this.oauthService.exchangeCodeForTokens({
            code,
            codeVerifier,
            redirectUri,
        });
        const profile = await this.oauthService.getProfile(tokens.accessToken);
        const calendars = await this.oauthService.listCalendars(tokens.accessToken);
        const storedTokens = await this.tokenStore.store(profile.id, tokens);
        const detail = await this.repository.persistConnection({
            avatarUrl: profile.picture ?? null,
            calendars: this.calendarCatalogService.mapCatalog(calendars),
            credentialStorageMode: storedTokens.credentialStorageMode,
            displayName: profile.name,
            email: profile.email,
            externalAccountId: profile.id,
            scopes: tokens.scope.split(' '),
            secretRef: storedTokens.secretRef,
            tokens: storedTokens.tokens,
        });

        return await this.syncService.syncConnection(detail.id);
    }

    async updateConnection(connectionId: string): Promise<GoogleConnectionDetail> {
        return await this.getConnectionDetail(connectionId);
    }

    async listEvents(input: GoogleCalendarListEventsInput): Promise<GoogleCalendarEvent[]> {
        return await this.repository.listEvents(input);
    }

    async updateCalendar(input: UpdateGoogleCalendarInput): Promise<GoogleCalendarSummary> {
        return await this.repository.updateCalendar(input);
    }

    async disconnectConnection(connectionId: string): Promise<void> {
        const connection = await this.repository.getConnectionRow(connectionId);

        if (!connection) {
            return;
        }

        await this.tokenStore.clear(connection);
        await this.repository.disconnectConnection(connectionId);
    }
}

function normalizeAccessRole(
    accessRole: string | undefined,
): PersistGoogleConnectionInput['calendars'][number]['accessRole'] {
    switch (accessRole) {
        case 'owner':
        case 'writer':
        case 'reader':
        case 'freeBusyReader':
            return accessRole;
        default:
            return 'reader';
    }
}

function inferCalendarType(
    id: string,
    summary: string,
): PersistGoogleConnectionInput['calendars'][number]['calendarType'] {
    const normalizedSummary = summary.toLowerCase();

    if (
        id.includes('#holiday@group.v.calendar.google.com') ||
        normalizedSummary.includes('holiday')
    ) {
        return 'holiday';
    }

    if (
        id.includes('#contacts@group.v.calendar.google.com') ||
        normalizedSummary.includes('birthday')
    ) {
        return 'birthday';
    }

    if (normalizedSummary.includes('resource')) {
        return 'resource';
    }

    return 'secondary';
}

function buildTokenServiceName(connectionId: string): string {
    return `day-flow/google-calendar/${connectionId}`;
}

function buildGoogleEventsUrl(calendarId: string): string {
    const params = buildQueryString({
        orderBy: 'startTime',
        singleEvents: 'true',
        timeMax: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
}

function buildQueryString(params: Record<string, string>): string {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

function buildUrlEncodedBody(params: Record<string, string>): string {
    return buildQueryString(params);
}

function mapEventToRow({
    calendarId,
    connectionId,
    event,
    timestamp,
}: {
    calendarId: string;
    connectionId: string;
    event: GoogleEventListResponse['items'][number];
    timestamp: string;
}): CalendarEventRow {
    const startsAt = event.start?.dateTime ?? event.start?.date;
    const endsAt = event.end?.dateTime ?? event.end?.date;

    if (!startsAt || !endsAt) {
        throw createDayFlowError('INTEGRATION_ERROR', 'Google event is missing start or end time.');
    }

    return {
        id: `${calendarId}:${event.id}`,
        provider: 'google',
        calendarId,
        connectionId,
        externalEventId: event.id,
        etag: null,
        title: event.summary ?? 'Untitled event',
        description: event.description ?? null,
        location: event.location ?? null,
        startAt: startsAt,
        endAt: endsAt,
        isAllDay: Boolean(event.start?.date && !event.start?.dateTime),
        timezone: null,
        status: event.status ?? 'confirmed',
        htmlLink: event.htmlLink ?? null,
        rawUpdatedAt: event.updated ?? null,
        lastSyncedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}
