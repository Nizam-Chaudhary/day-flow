import { app } from 'electron';
import { join } from 'node:path';

import { resolveAppDatabasePath } from '@/db/storage-paths';

export interface DatabasePathContext {
    appPath: string;
    isPackaged: boolean;
    resourcesPath: string;
    userDataPath: string;
}

export function resolveDatabasePath(userDataPath: string): string {
    return resolveAppDatabasePath(userDataPath);
}

export function resolveMigrationsPath({
    appPath,
    isPackaged,
    resourcesPath,
}: Pick<DatabasePathContext, 'appPath' | 'isPackaged' | 'resourcesPath'>): string {
    return isPackaged
        ? join(resourcesPath, 'migrations')
        : join(appPath, 'src', 'db', 'migrations');
}

export function getDatabasePathContext(): DatabasePathContext {
    return {
        appPath: app.getAppPath(),
        isPackaged: app.isPackaged,
        resourcesPath: process.resourcesPath,
        userDataPath: app.getPath('userData'),
    };
}

export function getDatabasePath(): string {
    return resolveDatabasePath(getDatabasePathContext().userDataPath);
}

export function getMigrationsPath(): string {
    const context = getDatabasePathContext();

    return resolveMigrationsPath(context);
}
