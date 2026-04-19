import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as schema from './schema';

export type DayFlowDatabase = LibSQLDatabase<typeof schema>;

export interface DatabaseClient {
    client: Client;
    databasePath: string;
    databaseUrl: string;
    db: DayFlowDatabase;
}

export interface CreateDatabaseClientOptions {
    databasePath: string;
}

let databaseClientPromise: Promise<DatabaseClient> | undefined;

export async function createDatabaseClient({
    databasePath,
}: CreateDatabaseClientOptions): Promise<DatabaseClient> {
    mkdirSync(dirname(databasePath), { recursive: true });

    const databaseUrl = `file:${databasePath}`;
    const client = createClient({ url: databaseUrl });
    const db = drizzle(client, { schema });

    try {
        await client.execute('PRAGMA foreign_keys = ON');
        await client.execute('PRAGMA journal_mode = WAL');
        await client.execute('PRAGMA busy_timeout = 5000');
    } catch (error) {
        client.close();
        throw error;
    }

    return {
        client,
        databasePath,
        databaseUrl,
        db,
    };
}

export function getOrCreateDatabaseClient(databasePath: string): Promise<DatabaseClient> {
    databaseClientPromise ??= createDatabaseClient({
        databasePath,
    }).catch((error) => {
        databaseClientPromise = undefined;
        throw error;
    });

    return databaseClientPromise;
}

export async function resetDatabaseClient(): Promise<void> {
    const clientPromise = databaseClientPromise;

    databaseClientPromise = undefined;

    if (!clientPromise) {
        return;
    }

    const { client } = await clientPromise;
    client.close();
}
