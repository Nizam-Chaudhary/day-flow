import { app } from 'electron';
import { join } from 'node:path';

export interface DatabasePathContext {
    appPath: string;
    isPackaged: boolean;
    resourcesPath: string;
    userDataPath: string;
}

export function resolveDatabasePath(userDataPath: string): string {
    return join(userDataPath, 'day-flow.sqlite');
}

export function resolveMigrationsPath({
    appPath,
    isPackaged,
    resourcesPath,
}: Pick<DatabasePathContext, 'appPath' | 'isPackaged' | 'resourcesPath'>): string {
    return isPackaged
        ? join(resourcesPath, 'drizzle')
        : join(appPath, '..', '..', '..', 'packages', 'db', 'drizzle');
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
