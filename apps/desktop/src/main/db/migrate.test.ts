import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createDatabaseClient } from '@/main/db/client';
import { runDatabaseMigrations } from '@/main/db/migrate';

const migrationsFolder = join(process.cwd(), '../../packages/db/drizzle');
const cleanupPaths = new Set<string>();

afterEach(() => {
    for (const cleanupPath of cleanupPaths) {
        rmSync(cleanupPath, { force: true, recursive: true });
    }

    cleanupPaths.clear();
});

describe('runDatabaseMigrations', () => {
    it('is idempotent across repeated starts', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-migrate-'));
        const databasePath = join(tempDirectory, 'app.sqlite');

        cleanupPaths.add(tempDirectory);

        const firstClient = await createDatabaseClient({ databasePath });
        const firstHealth = await runDatabaseMigrations(firstClient, migrationsFolder);

        expect(firstHealth.databaseReady).toBe(true);
        firstClient.client.close();

        const secondClient = await createDatabaseClient({ databasePath });

        await expect(runDatabaseMigrations(secondClient, migrationsFolder)).resolves.toMatchObject({
            databasePath,
            databaseReady: true,
        });
        await expect(
            secondClient.client.execute(
                "select name from sqlite_master where type = 'table' and name = 'app_preferences'",
            ),
        ).resolves.toMatchObject({
            rows: [{ name: 'app_preferences' }],
        });

        secondClient.client.close();
    });
});
