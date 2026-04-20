import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const APP_DATA_DIRECTORY_NAME = 'day-flow';
export const APP_DATABASE_FILENAME = 'day-flow.sqlite';

export function resolvePlatformAppDataPath(): string {
    switch (process.platform) {
        case 'darwin':
            return join(homedir(), 'Library', 'Application Support');
        case 'win32':
            return process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
        default:
            return process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
    }
}

export function resolveAppDataDirectoryPath(basePath: string): string {
    return join(basePath, APP_DATA_DIRECTORY_NAME);
}

export function resolveAppDatabasePath(appDataPath: string): string {
    return join(appDataPath, APP_DATABASE_FILENAME);
}

export function resolveElectronUserDataPath(defaultUserDataPath: string): string {
    return resolveAppDataDirectoryPath(dirname(defaultUserDataPath));
}
