import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createDatabaseClient } from '@/db/client';
import { runDatabaseMigrations } from '@/db/migrate';

const migrationsFolder = join(process.cwd(), 'src', 'db', 'drizzle');
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

    it('upgrades the calendar event unique index to include calendar scope', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-migrate-'));
        const databasePath = join(tempDirectory, 'app.sqlite');
        const legacyMigrationsFolder = join(tempDirectory, 'legacy-migrations');

        cleanupPaths.add(tempDirectory);

        cpSync(migrationsFolder, legacyMigrationsFolder, { recursive: true });
        rmSync(join(legacyMigrationsFolder, '0002_calendar_events_identity_scope.sql'));
        writeFileSync(
            join(legacyMigrationsFolder, 'meta', '_journal.json'),
            JSON.stringify(
                {
                    dialect: 'sqlite',
                    entries: [
                        {
                            breakpoints: true,
                            idx: 0,
                            tag: '0000_concerned_madripoor',
                            version: '6',
                            when: 1776524502673,
                        },
                        {
                            breakpoints: true,
                            idx: 1,
                            tag: '0001_google_calendar_integration',
                            version: '6',
                            when: 1776579630000,
                        },
                    ],
                    version: '7',
                },
                null,
                4,
            ),
        );

        const legacyClient = await createDatabaseClient({ databasePath });
        await runDatabaseMigrations(legacyClient, legacyMigrationsFolder);
        legacyClient.client.close();

        const upgradedClient = await createDatabaseClient({ databasePath });
        await runDatabaseMigrations(upgradedClient, migrationsFolder);

        await expect(
            upgradedClient.client.execute(
                "select name, sql from sqlite_master where type = 'index' and tbl_name = 'calendar_events' order by name",
            ),
        ).resolves.toMatchObject({
            rows: [
                {
                    name: 'calendar_events_calendar_idx',
                    sql: 'CREATE INDEX `calendar_events_calendar_idx` ON `calendar_events` (`calendar_id`)',
                },
                {
                    name: 'calendar_events_provider_connection_calendar_external_idx',
                    sql: 'CREATE UNIQUE INDEX `calendar_events_provider_connection_calendar_external_idx` ON `calendar_events` (`provider`,`connection_id`,`calendar_id`,`external_event_id`)',
                },
                {
                    name: 'sqlite_autoindex_calendar_events_1',
                    sql: null,
                },
            ],
        });

        upgradedClient.client.close();
    });
});
