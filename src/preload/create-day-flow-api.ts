import { ipcRenderer } from "electron";

import {
    APP_GET_HEALTH_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from "@/shared/channels";
import type { AppHealth } from "@/shared/contracts/health";
import type { AppPreferences, UpdateAppPreferencesInput } from "@/shared/contracts/settings";
import { type DayFlowResult, toDayFlowRendererError } from "@/shared/errors";

export interface DayFlowApi {
    app: {
        getHealth(): Promise<AppHealth>;
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
        settings: Object.freeze({
            getPreferences: () => invokeDayFlow<void, AppPreferences>(SETTINGS_GET_CHANNEL),
            updatePreferences: (input) =>
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
