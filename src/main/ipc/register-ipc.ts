import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import { getDatabaseHealth } from '@/main/db/migrate';
import { createSettingsService, type SettingsService } from '@/main/settings/settings-service';
import {
    APP_GET_HEALTH_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from '@/shared/channels';
import { type AppHealth } from '@/shared/contracts/health';
import { type UpdateAppPreferencesInput } from '@/shared/contracts/settings';
import { dayFlowErr, dayFlowOk, normalizeDayFlowError, type DayFlowResult } from '@/shared/errors';

interface IpcDependencies {
    getHealth?: () => AppHealth;
    settingsService?: SettingsService;
}

type DayFlowIpcHandler = (
    event: IpcMainInvokeEvent,
    input?: unknown,
) => Promise<DayFlowResult<unknown>>;

export function createIpcHandlers({
    getHealth = getDatabaseHealth,
    settingsService = createSettingsService(),
}: IpcDependencies = {}): Record<string, DayFlowIpcHandler> {
    return {
        [APP_GET_HEALTH_CHANNEL]: async () => handleIpcOperation(() => getHealth()),
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
