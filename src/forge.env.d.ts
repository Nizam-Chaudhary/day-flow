/// <reference types="vite/client" />

import type { AppHealth } from '@/shared/contracts/health';
import type { AppPreferences, UpdateAppPreferencesInput } from '@/shared/contracts/settings';

interface ElectronAppInfo {
    platform: NodeJS.Platform;
    versions: {
        electron: string;
        chrome: string;
        node: string;
    };
}

interface DayFlowApi {
    app: {
        getHealth(): Promise<AppHealth>;
    };
    settings: {
        getPreferences(): Promise<AppPreferences>;
        updatePreferences(input: UpdateAppPreferencesInput): Promise<AppPreferences>;
    };
}

declare global {
    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
    const MAIN_WINDOW_VITE_NAME: string;

    interface Window {
        dayFlowApi: DayFlowApi;
        electronApp: ElectronAppInfo;
    }
}

export {};
