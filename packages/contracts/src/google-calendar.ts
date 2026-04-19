export const GOOGLE_PROVIDERS = ['google'] as const;
export const GOOGLE_CREDENTIAL_STORAGE_MODES = ['keychain', 'sqlite_plaintext'] as const;
export const GOOGLE_SYNC_STATUS_VALUES = ['idle', 'success', 'error'] as const;
export const GOOGLE_REMINDER_CHANNELS = ['in_app', 'email', 'slack'] as const;
export const GOOGLE_CALENDAR_TYPES = [
    'default',
    'holiday',
    'birthday',
    'secondary',
    'resource',
    'other',
] as const;
export const GOOGLE_ACCESS_ROLES = ['owner', 'writer', 'reader', 'freeBusyReader'] as const;
export const GOOGLE_SYNC_INTERVAL_OPTIONS = [5, 15, 30, 60, 180, 360, 720, 1440] as const;
export const GOOGLE_REMINDER_LEAD_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440] as const;

export type GoogleProvider = (typeof GOOGLE_PROVIDERS)[number];
export type GoogleCredentialStorageMode = (typeof GOOGLE_CREDENTIAL_STORAGE_MODES)[number];
export type GoogleSyncStatus = (typeof GOOGLE_SYNC_STATUS_VALUES)[number];
export type GoogleReminderChannel = (typeof GOOGLE_REMINDER_CHANNELS)[number];
export type GoogleCalendarType = (typeof GOOGLE_CALENDAR_TYPES)[number];
export type GoogleCalendarAccessRole = (typeof GOOGLE_ACCESS_ROLES)[number];
export type GoogleSyncIntervalMinutes = (typeof GOOGLE_SYNC_INTERVAL_OPTIONS)[number];
export type GoogleReminderLeadMinutes = (typeof GOOGLE_REMINDER_LEAD_OPTIONS)[number];

export interface GoogleCalendarReminderConfig {
    reminderChannel: GoogleReminderChannel;
    reminderEnabled: boolean;
    reminderLeadMinutes: GoogleReminderLeadMinutes;
}

export interface GoogleCalendarSummary extends GoogleCalendarReminderConfig {
    accessRole: GoogleCalendarAccessRole;
    colorOverride: string | null;
    connectionId: string;
    effectiveColor: string;
    externalCalendarId: string;
    googleBackgroundColor: string | null;
    googleForegroundColor: string | null;
    id: string;
    isPrimary: boolean;
    isSelected: boolean;
    lastSyncAt: string | null;
    lastSyncError: string | null;
    lastSyncStatus: GoogleSyncStatus;
    name: string;
    syncEnabled: boolean;
    syncIntervalMinutes: GoogleSyncIntervalMinutes;
    type: GoogleCalendarType;
}

export interface GoogleConnectionSummary {
    credentialStorageMode: GoogleCredentialStorageMode;
    displayName: string;
    email: string;
    id: string;
    lastSyncAt: string | null;
    lastSyncError: string | null;
    lastSyncStatus: GoogleSyncStatus;
    scopes: string[];
    selectedCalendarCount: number;
}

export interface GoogleConnectionDetail extends GoogleConnectionSummary {
    calendars: GoogleCalendarSummary[];
}

export interface StartGoogleConnectionResult {
    authUrl: string;
    connectionId: string;
    email: string;
    flowId: string;
}

export interface UpdateGoogleConnectionInput {
    connectionId: string;
}

export interface UpdateGoogleCalendarInput extends Partial<GoogleCalendarReminderConfig> {
    calendarId: string;
    colorOverride?: string | null;
    isSelected?: boolean;
    syncEnabled?: boolean;
    syncIntervalMinutes?: GoogleSyncIntervalMinutes;
}

export interface GoogleOAuthTokenSet {
    accessToken: string;
    expiresAt: string | null;
    refreshToken: string | null;
    scope: string;
}

export interface GoogleOAuthFlowRecord {
    authUrl: string;
    codeChallenge: string;
    codeVerifier: string;
    expiresAt: string;
    flowId: string;
    redirectUri: string;
    state: string;
}

export interface GoogleOAuthFlowResult {
    code?: string;
    error?: string;
    errorDescription?: string;
    expiresAt: string;
    flowId: string;
    state: string;
    status: 'completed' | 'failed' | 'pending';
}

export interface GoogleCalendarListResponse {
    items: Array<{
        accessRole?: string;
        backgroundColor?: string;
        description?: string;
        foregroundColor?: string;
        id: string;
        primary?: boolean;
        summary: string;
        summaryOverride?: string;
    }>;
}

export interface GoogleEventListResponse {
    items: Array<{
        created?: string;
        description?: string;
        end?: { date?: string; dateTime?: string; timeZone?: string };
        etag?: string;
        htmlLink?: string;
        id: string;
        location?: string;
        start?: { date?: string; dateTime?: string; timeZone?: string };
        status?: string;
        summary?: string;
        updated?: string;
    }>;
}

export function isGoogleReminderChannel(value: unknown): value is GoogleReminderChannel {
    return typeof value === 'string' && GOOGLE_REMINDER_CHANNELS.includes(value as never);
}

export function isGoogleSyncIntervalMinutes(value: unknown): value is GoogleSyncIntervalMinutes {
    return typeof value === 'number' && GOOGLE_SYNC_INTERVAL_OPTIONS.includes(value as never);
}

export function isGoogleReminderLeadMinutes(value: unknown): value is GoogleReminderLeadMinutes {
    return typeof value === 'number' && GOOGLE_REMINDER_LEAD_OPTIONS.includes(value as never);
}
