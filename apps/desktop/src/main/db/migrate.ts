import { migrate } from 'drizzle-orm/libsql/migrator';

import type { AppHealth } from '@/shared/contracts/health';

import { getDatabaseClient, type DatabaseClient } from '@/main/db/client';
import { getDatabasePath, getMigrationsPath } from '@/main/db/paths';

interface MigrationState {
    databasePath?: string;
    databaseReady: boolean;
    lastMigrationAt?: string;
}

const migrationState: MigrationState = {
    databaseReady: false,
};

export async function runDatabaseMigrations(
    client: DatabaseClient,
    migrationsFolder: string,
): Promise<AppHealth> {
    await migrate(client.db, { migrationsFolder });

    migrationState.databasePath = client.databasePath;
    migrationState.databaseReady = true;
    migrationState.lastMigrationAt = new Date().toISOString();

    return getDatabaseHealth();
}

export async function bootstrapDatabase(): Promise<AppHealth> {
    return await runDatabaseMigrations(await getDatabaseClient(), getMigrationsPath());
}

export function getDatabaseHealth(): AppHealth {
    return {
        databaseReady: migrationState.databaseReady,
        databasePath: migrationState.databasePath ?? getDatabasePath(),
        ...(migrationState.lastMigrationAt
            ? { lastMigrationAt: migrationState.lastMigrationAt }
            : {}),
    };
}
