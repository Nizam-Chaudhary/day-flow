import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { getDatabaseClient, type DatabaseClient } from "@/main/db/client";
import { getDatabasePath, getMigrationsPath } from "@/main/db/paths";
import type { AppHealth } from "@/shared/contracts/health";

interface MigrationState {
    databasePath?: string;
    databaseReady: boolean;
    lastMigrationAt?: string;
}

const migrationState: MigrationState = {
    databaseReady: false,
};

export function runDatabaseMigrations(client: DatabaseClient, migrationsFolder: string): AppHealth {
    migrate(client.db, { migrationsFolder });

    migrationState.databasePath = client.databasePath;
    migrationState.databaseReady = true;
    migrationState.lastMigrationAt = new Date().toISOString();

    return getDatabaseHealth();
}

export function bootstrapDatabase(): AppHealth {
    return runDatabaseMigrations(getDatabaseClient(), getMigrationsPath());
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
