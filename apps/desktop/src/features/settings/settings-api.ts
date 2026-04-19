import type { AppHealth } from '@/shared/contracts/health';
import type { AppPreferences, UpdateAppPreferencesInput } from '@/shared/contracts/settings';

export function getAppHealth(): Promise<AppHealth> {
    return window.dayFlowApi.app.getHealth();
}

export function getAppPreferences(): Promise<AppPreferences> {
    return window.dayFlowApi.settings.getPreferences();
}

export function updateAppPreferences(input: UpdateAppPreferencesInput): Promise<AppPreferences> {
    return window.dayFlowApi.settings.updatePreferences(input);
}
