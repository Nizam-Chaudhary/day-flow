import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { getDatabaseHealth } from '@/db/migrate';
import { getGoogleCalendarService, type GoogleCalendarService } from '@/main/google-calendar';
import { createSettingsService, type SettingsService } from '@/main/settings';
import {
    APP_GET_HEALTH_CHANNEL,
    GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_GET_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL,
    GOOGLE_CALENDAR_START_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_SYNC_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_UPDATE_CALENDAR_CHANNEL,
    GOOGLE_CALENDAR_UPDATE_CONNECTION_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from '@/schemas/contracts/channels';
import {
    dayFlowErr,
    dayFlowOk,
    normalizeDayFlowError,
    type DayFlowResult,
} from '@/schemas/contracts/errors';
import { type AppHealth } from '@/schemas/contracts/health';
import { type UpdateAppPreferencesInput } from '@/schemas/contracts/settings';

interface IpcDependencies {
    getHealth?: () => AppHealth;
    googleCalendarService?: GoogleCalendarService;
    settingsService?: SettingsService;
}

type DayFlowIpcHandler = (
    event: IpcMainInvokeEvent,
    input?: unknown,
) => Promise<DayFlowResult<unknown>>;

export function createIpcHandlers({
    getHealth = getDatabaseHealth,
    googleCalendarService = getGoogleCalendarService(),
    settingsService = createSettingsService(),
}: IpcDependencies = {}): Record<string, DayFlowIpcHandler> {
    return {
        [APP_GET_HEALTH_CHANNEL]: async () => handleIpcOperation(() => getHealth()),
        [GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL]: async (_event, input) =>
            handleIpcOperation(() =>
                googleCalendarService.disconnectConnection(input as string).then(() => undefined),
            ),
        [GOOGLE_CALENDAR_GET_CONNECTION_CHANNEL]: async (_event, input) =>
            handleIpcOperation(() => googleCalendarService.getConnectionDetail(input as string)),
        [GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL]: async () =>
            handleIpcOperation(() => googleCalendarService.listConnections()),
        [GOOGLE_CALENDAR_START_CONNECTION_CHANNEL]: async () =>
            handleIpcOperation(() => googleCalendarService.startConnection()),
        [GOOGLE_CALENDAR_SYNC_CONNECTION_CHANNEL]: async (_event, input) =>
            handleIpcOperation(() => googleCalendarService.syncConnection(input as string)),
        [GOOGLE_CALENDAR_UPDATE_CALENDAR_CHANNEL]: async (_event, input) =>
            handleIpcOperation(() =>
                googleCalendarService.updateCalendar(
                    input as Parameters<GoogleCalendarService['updateCalendar']>[0],
                ),
            ),
        [GOOGLE_CALENDAR_UPDATE_CONNECTION_CHANNEL]: async (_event, input) =>
            handleIpcOperation(() =>
                googleCalendarService.updateConnection(
                    input as Parameters<GoogleCalendarService['updateConnection']>[0],
                ),
            ),
        [SETTINGS_GET_CHANNEL]: async () =>
            handleIpcOperation(() => settingsService.getPreferences()),
        [SETTINGS_UPDATE_CHANNEL]: async (_event, input) =>
            handleIpcOperation(() =>
                settingsService.updatePreferences(input as UpdateAppPreferencesInput),
            ),
    };
}

export function registerIpcHandlers(dependencies?: IpcDependencies): void {
    const handlers = createIpcHandlers(dependencies);

    for (const [channel, handler] of Object.entries(handlers)) {
        ipcMain.removeHandler(channel);
        ipcMain.handle(channel, handler);
    }
}

async function handleIpcOperation<T>(operation: () => T | Promise<T>): Promise<DayFlowResult<T>> {
    try {
        return dayFlowOk(await operation());
    } catch (error) {
        return dayFlowErr(normalizeDayFlowError(error));
    }
}
