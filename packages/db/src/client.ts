import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as schema from './schema';

export type DayFlowDatabase = BetterSQLite3Database<typeof schema>;

export interface DatabaseClient {
    databasePath: string;
    db: DayFlowDatabase;
    sqlite: Database.Database;
}

export interface CreateDatabaseClientOptions {
    databasePath: string;
}

let databaseClient: DatabaseClient | undefined;

export function createDatabaseClient({
    databasePath,
}: CreateDatabaseClientOptions): DatabaseClient {
    mkdirSync(dirname(databasePath), { recursive: true });

    const sqlite = new Database(databasePath);

    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('busy_timeout = 5000');

    return {
        databasePath,
        db: drizzle(sqlite, { schema }),
        sqlite,
    };
}

export function getOrCreateDatabaseClient(databasePath: string): DatabaseClient {
    databaseClient ??= createDatabaseClient({
        databasePath,
    });

    return databaseClient;
}

export function resetDatabaseClient(): void {
    databaseClient?.sqlite.close();
    databaseClient = undefined;
}
