import { ipcRenderer } from 'electron';

import type {
    GoogleCalendarEvent,
    GoogleCalendarListEventsInput,
    GoogleConnectionDetail,
    StartGoogleConnectionResult,
    UpdateGoogleCalendarInput,
    UpdateGoogleConnectionInput,
} from '@/schemas/contracts/google-calendar';
import type { AppHealth } from '@/schemas/contracts/health';
import type { AppPreferences, UpdateAppPreferencesInput } from '@/schemas/contracts/settings';

import {
    APP_GET_HEALTH_CHANNEL,
    GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_GET_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL,
    GOOGLE_CALENDAR_LIST_EVENTS_CHANNEL,
    GOOGLE_CALENDAR_START_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_SYNC_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_UPDATE_CALENDAR_CHANNEL,
    GOOGLE_CALENDAR_UPDATE_CONNECTION_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from '@/schemas/contracts/channels';
import { type DayFlowResult, toDayFlowRendererError } from '@/schemas/contracts/errors';

export interface DayFlowApi {
    app: {
        getHealth(): Promise<AppHealth>;
    };
    googleCalendar: {
        disconnectConnection(connectionId: string): Promise<void>;
        getConnectionDetail(connectionId: string): Promise<GoogleConnectionDetail>;
        listConnections(): Promise<GoogleConnectionDetail[]>;
        listEvents(input: GoogleCalendarListEventsInput): Promise<GoogleCalendarEvent[]>;
        startConnection(): Promise<StartGoogleConnectionResult>;
        syncConnection(connectionId: string): Promise<GoogleConnectionDetail>;
        updateCalendar(input: UpdateGoogleCalendarInput): Promise<GoogleConnectionDetail>;
        updateConnection(input: UpdateGoogleConnectionInput): Promise<GoogleConnectionDetail>;
    };
    settings: {
        getPreferences(): Promise<AppPreferences>;
        updatePreferences(input: UpdateAppPreferencesInput): Promise<AppPreferences>;
    };
}

export function createDayFlowApi(): DayFlowApi {
    return Object.freeze({
        app: Object.freeze({
            getHealth: () => invokeDayFlow<void, AppHealth>(APP_GET_HEALTH_CHANNEL),
        }),
        googleCalendar: Object.freeze({
            disconnectConnection: (connectionId: string) =>
                invokeDayFlow<string, void>(
                    GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL,
                    connectionId,
                ),
            getConnectionDetail: (connectionId: string) =>
                invokeDayFlow<string, GoogleConnectionDetail>(
                    GOOGLE_CALENDAR_GET_CONNECTION_CHANNEL,
                    connectionId,
                ),
            listConnections: () =>
                invokeDayFlow<void, GoogleConnectionDetail[]>(
                    GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL,
                ),
            listEvents: (input: GoogleCalendarListEventsInput) =>
                invokeDayFlow<GoogleCalendarListEventsInput, GoogleCalendarEvent[]>(
                    GOOGLE_CALENDAR_LIST_EVENTS_CHANNEL,
                    input,
                ),
            startConnection: () =>
                invokeDayFlow<void, StartGoogleConnectionResult>(
                    GOOGLE_CALENDAR_START_CONNECTION_CHANNEL,
                ),
            syncConnection: (connectionId: string) =>
                invokeDayFlow<string, GoogleConnectionDetail>(
                    GOOGLE_CALENDAR_SYNC_CONNECTION_CHANNEL,
                    connectionId,
                ),
            updateCalendar: (input: UpdateGoogleCalendarInput) =>
                invokeDayFlow<UpdateGoogleCalendarInput, GoogleConnectionDetail>(
                    GOOGLE_CALENDAR_UPDATE_CALENDAR_CHANNEL,
                    input,
                ),
            updateConnection: (input: UpdateGoogleConnectionInput) =>
                invokeDayFlow<UpdateGoogleConnectionInput, GoogleConnectionDetail>(
                    GOOGLE_CALENDAR_UPDATE_CONNECTION_CHANNEL,
                    input,
                ),
        }),
        settings: Object.freeze({
            getPreferences: () => invokeDayFlow<void, AppPreferences>(SETTINGS_GET_CHANNEL),
            updatePreferences: (input: UpdateAppPreferencesInput) =>
                invokeDayFlow<UpdateAppPreferencesInput, AppPreferences>(
                    SETTINGS_UPDATE_CHANNEL,
                    input,
                ),
        }),
    });
}

async function invokeDayFlow<TInput, TOutput>(channel: string, input?: TInput): Promise<TOutput> {
    const result = (await ipcRenderer.invoke(channel, input)) as DayFlowResult<TOutput>;

    if (result.ok) {
        return result.data;
    }

    throw toDayFlowRendererError(result.error);
}
