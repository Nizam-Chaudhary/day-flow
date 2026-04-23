import { z } from 'zod';

export const GOOGLE_PROVIDERS = ['google'] as const;
export const GOOGLE_CREDENTIAL_STORAGE_MODES = ['keychain', 'sqlite_plaintext'] as const;
export const GOOGLE_SYNC_STATUS_VALUES = ['idle', 'success', 'error'] as const;
export const GOOGLE_REMINDER_CHANNELS = ['in_app', 'email', 'slack'] as const;
export const GOOGLE_CALENDAR_COLOR_TYPES = ['curated', 'custom'] as const;
export const GOOGLE_CALENDAR_TYPES = [
    'default',
    'holiday',
    'birthday',
    'secondary',
    'resource',
    'other',
] as const;
export const GOOGLE_ACCESS_ROLES = ['owner', 'writer', 'reader', 'freeBusyReader'] as const;
export const GOOGLE_SYNC_INTERVAL_OPTIONS = [1, 5, 15, 30, 60, 180, 360, 720, 1440] as const;
export const GOOGLE_REMINDER_LEAD_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440] as const;

export const googleProviderSchema = z.enum(GOOGLE_PROVIDERS);
export const googleCredentialStorageModeSchema = z.enum(GOOGLE_CREDENTIAL_STORAGE_MODES);
export const googleSyncStatusSchema = z.enum(GOOGLE_SYNC_STATUS_VALUES);
export const googleReminderChannelSchema = z.enum(GOOGLE_REMINDER_CHANNELS);
export const googleCalendarColorTypeSchema = z.enum(GOOGLE_CALENDAR_COLOR_TYPES);
export const googleCalendarTypeSchema = z.enum(GOOGLE_CALENDAR_TYPES);
export const googleCalendarAccessRoleSchema = z.enum(GOOGLE_ACCESS_ROLES);
export const googleSyncIntervalMinutesSchema = z.union(
    GOOGLE_SYNC_INTERVAL_OPTIONS.map((value) => z.literal(value)) as [
        z.ZodLiteral<number>,
        ...z.ZodLiteral<number>[],
    ],
);
export const googleReminderLeadMinutesSchema = z.union(
    GOOGLE_REMINDER_LEAD_OPTIONS.map((value) => z.literal(value)) as [
        z.ZodLiteral<number>,
        ...z.ZodLiteral<number>[],
    ],
);

export const googleCalendarReminderConfigSchema = z.object({
    reminderChannel: googleReminderChannelSchema,
    reminderEnabled: z.boolean(),
    reminderLeadMinutesList: z.array(googleReminderLeadMinutesSchema).min(1),
});

export const googleCalendarSummarySchema = googleCalendarReminderConfigSchema.extend({
    accessRole: googleCalendarAccessRoleSchema,
    calendarColorType: googleCalendarColorTypeSchema,
    colorOverride: z.string().nullable(),
    connectionId: z.string(),
    effectiveColor: z.string(),
    externalCalendarId: z.string(),
    googleBackgroundColor: z.string().nullable(),
    googleForegroundColor: z.string().nullable(),
    id: z.string(),
    isPrimary: z.boolean(),
    isSelected: z.boolean(),
    lastSyncAt: z.string().nullable(),
    lastSyncError: z.string().nullable(),
    lastSyncStatus: googleSyncStatusSchema,
    name: z.string(),
    syncEnabled: z.boolean(),
    syncIntervalMinutes: googleSyncIntervalMinutesSchema,
    type: googleCalendarTypeSchema,
});

export const googleConnectionSummarySchema = z.object({
    credentialStorageMode: googleCredentialStorageModeSchema,
    displayName: z.string(),
    email: z.string(),
    id: z.string(),
    lastSyncAt: z.string().nullable(),
    lastSyncError: z.string().nullable(),
    lastSyncStatus: googleSyncStatusSchema,
    scopes: z.array(z.string()),
    selectedCalendarCount: z.number(),
});

export const googleConnectionDetailSchema = googleConnectionSummarySchema.extend({
    calendars: z.array(googleCalendarSummarySchema),
});

export const startGoogleConnectionResultSchema = z.object({
    authUrl: z.string(),
    connectionId: z.string(),
    email: z.string(),
    flowId: z.string(),
});

export const updateGoogleConnectionInputSchema = z.object({
    connectionId: z.string(),
});

export const updateGoogleCalendarInputSchema = z.object({
    calendarId: z.string(),
    calendarColorType: googleCalendarColorTypeSchema.optional(),
    colorOverride: z.string().nullable().optional(),
    isSelected: z.boolean().optional(),
    reminderChannel: googleReminderChannelSchema.optional(),
    reminderEnabled: z.boolean().optional(),
    reminderLeadMinutesList: z.array(googleReminderLeadMinutesSchema).min(1).optional(),
    syncEnabled: z.boolean().optional(),
    syncIntervalMinutes: googleSyncIntervalMinutesSchema.optional(),
});

export const googleOAuthTokenSetSchema = z.object({
    accessToken: z.string(),
    expiresAt: z.string().nullable(),
    refreshToken: z.string().nullable(),
    scope: z.string(),
});

export const googleOAuthFlowRecordSchema = z.object({
    authUrl: z.string(),
    codeChallenge: z.string(),
    codeVerifier: z.string(),
    expiresAt: z.string(),
    flowId: z.string(),
    redirectUri: z.string(),
    state: z.string(),
});

export const googleOAuthFlowResultSchema = z.object({
    code: z.string().optional(),
    error: z.string().optional(),
    errorDescription: z.string().optional(),
    expiresAt: z.string(),
    flowId: z.string(),
    state: z.string(),
    status: z.enum(['completed', 'failed', 'pending']),
});

export const createGoogleOAuthFlowInputSchema = z.object({
    clientId: z.string(),
    scopes: z.array(z.string()),
});

export const googleCalendarListResponseSchema = z.object({
    items: z.array(
        z.object({
            accessRole: z.string().optional(),
            backgroundColor: z.string().optional(),
            description: z.string().optional(),
            foregroundColor: z.string().optional(),
            id: z.string(),
            primary: z.boolean().optional(),
            summary: z.string(),
            summaryOverride: z.string().optional(),
        }),
    ),
});

export const googleEventListResponseSchema = z.object({
    items: z.array(
        z.object({
            created: z.string().optional(),
            description: z.string().optional(),
            end: z
                .object({
                    date: z.string().optional(),
                    dateTime: z.string().optional(),
                    timeZone: z.string().optional(),
                })
                .optional(),
            etag: z.string().optional(),
            htmlLink: z.string().optional(),
            id: z.string(),
            location: z.string().optional(),
            start: z
                .object({
                    date: z.string().optional(),
                    dateTime: z.string().optional(),
                    timeZone: z.string().optional(),
                })
                .optional(),
            status: z.string().optional(),
            summary: z.string().optional(),
            updated: z.string().optional(),
        }),
    ),
});

export const googleCalendarListEventsInputSchema = z.object({
    rangeEnd: z.string(),
    rangeStart: z.string(),
});

export const googleCalendarEventSchema = z.object({
    calendarColor: z.string(),
    calendarId: z.string(),
    calendarName: z.string(),
    connectionId: z.string(),
    description: z.string().nullable(),
    endAt: z.string(),
    htmlLink: z.string().nullable(),
    id: z.string(),
    isAllDay: z.boolean(),
    location: z.string().nullable(),
    provider: googleProviderSchema,
    startAt: z.string(),
    status: z.string(),
    title: z.string(),
});

export const googleCalendarListEventsResponseSchema = z.array(googleCalendarEventSchema);

export type GoogleProvider = z.infer<typeof googleProviderSchema>;
export type GoogleCredentialStorageMode = z.infer<typeof googleCredentialStorageModeSchema>;
export type GoogleSyncStatus = z.infer<typeof googleSyncStatusSchema>;
export type GoogleReminderChannel = z.infer<typeof googleReminderChannelSchema>;
export type GoogleCalendarColorType = z.infer<typeof googleCalendarColorTypeSchema>;
export type GoogleCalendarType = z.infer<typeof googleCalendarTypeSchema>;
export type GoogleCalendarAccessRole = z.infer<typeof googleCalendarAccessRoleSchema>;
export type GoogleSyncIntervalMinutes = z.infer<typeof googleSyncIntervalMinutesSchema>;
export type GoogleReminderLeadMinutes = z.infer<typeof googleReminderLeadMinutesSchema>;
export type GoogleCalendarReminderConfig = z.infer<typeof googleCalendarReminderConfigSchema>;
export type GoogleCalendarSummary = z.infer<typeof googleCalendarSummarySchema>;
export type GoogleConnectionSummary = z.infer<typeof googleConnectionSummarySchema>;
export type GoogleConnectionDetail = z.infer<typeof googleConnectionDetailSchema>;
export type StartGoogleConnectionResult = z.infer<typeof startGoogleConnectionResultSchema>;
export type UpdateGoogleConnectionInput = z.infer<typeof updateGoogleConnectionInputSchema>;
export type UpdateGoogleCalendarInput = z.infer<typeof updateGoogleCalendarInputSchema>;
export type GoogleOAuthTokenSet = z.infer<typeof googleOAuthTokenSetSchema>;
export type GoogleOAuthFlowRecord = z.infer<typeof googleOAuthFlowRecordSchema>;
export type GoogleOAuthFlowResult = z.infer<typeof googleOAuthFlowResultSchema>;
export type CreateGoogleOAuthFlowInput = z.infer<typeof createGoogleOAuthFlowInputSchema>;
export type GoogleCalendarListResponse = z.infer<typeof googleCalendarListResponseSchema>;
export type GoogleEventListResponse = z.infer<typeof googleEventListResponseSchema>;
export type GoogleCalendarListEventsInput = z.infer<typeof googleCalendarListEventsInputSchema>;
export type GoogleCalendarEvent = z.infer<typeof googleCalendarEventSchema>;
export type GoogleCalendarListEventsResponse = z.infer<
    typeof googleCalendarListEventsResponseSchema
>;

export function isGoogleReminderChannel(value: unknown): value is GoogleReminderChannel {
    return googleReminderChannelSchema.safeParse(value).success;
}

export function isGoogleSyncIntervalMinutes(value: unknown): value is GoogleSyncIntervalMinutes {
    return googleSyncIntervalMinutesSchema.safeParse(value).success;
}

export function isGoogleReminderLeadMinutes(value: unknown): value is GoogleReminderLeadMinutes {
    return googleReminderLeadMinutesSchema.safeParse(value).success;
}
