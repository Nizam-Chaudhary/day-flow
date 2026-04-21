import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createDatabaseClient } from '@/db/client';
import { runDatabaseMigrations } from '@/db/migrate';

const migrationsFolder = join(process.cwd(), 'src', 'db', 'migrations');
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
                "select name from sqlite_master where type = 'table' and name = 'integration_calendars'",
            ),
        ).resolves.toMatchObject({
            rows: [{ name: 'integration_calendars' }],
        });

        secondClient.client.close();
    });

    it('backfills scalar reminder lead minutes into reminder arrays', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-migrate-'));
        const databasePath = join(tempDirectory, 'app.sqlite');
        const legacyMigrationsFolder = join(tempDirectory, 'legacy-migrations');

        cleanupPaths.add(tempDirectory);

        cpSync(migrationsFolder, legacyMigrationsFolder, { recursive: true });
        rmSync(join(legacyMigrationsFolder, '0001_google_calendar_multi_reminders.sql'));
        writeFileSync(
            join(legacyMigrationsFolder, 'meta', '_journal.json'),
            JSON.stringify(
                {
                    dialect: 'sqlite',
                    entries: [
                        {
                            breakpoints: true,
                            idx: 0,
                            tag: '0000_daffy_photon',
                            version: '6',
                            when: 1776712845731,
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
        await legacyClient.client.execute(`
            INSERT INTO integration_connections (
                id, provider, external_account_id, email, display_name, avatar_url,
                credential_storage_mode, secret_ref, access_token, refresh_token,
                token_expires_at, scopes_json, last_sync_at, last_sync_status,
                last_sync_error, created_at, updated_at
            ) VALUES (
                'google:user-1', 'google', 'user-1', 'user@example.com', 'User', NULL,
                'sqlite_plaintext', NULL, 'access-token', 'refresh-token',
                NULL, '["openid","email"]', NULL, 'idle',
                NULL, '2026-04-18T00:00:00.000Z', '2026-04-18T00:00:00.000Z'
            );
        `);
        await legacyClient.client.execute(`
            INSERT INTO integration_calendars (
                id, connection_id, external_calendar_id, name, description, calendar_type,
                access_role, google_background_color, google_foreground_color, is_primary,
                is_selected, sync_enabled, sync_interval_minutes, reminder_enabled,
                reminder_channel, reminder_lead_minutes, calendar_color_type, color_override,
                last_sync_at, last_sync_status, last_sync_error, created_at, updated_at
            ) VALUES (
                'google:user-1:primary',
                'google:user-1',
                'primary',
                'Primary',
                NULL,
                'default',
                'owner',
                '#1a73e8',
                '#ffffff',
                1,
                1,
                1,
                15,
                1,
                'in_app',
                30,
                'curated',
                NULL,
                NULL,
                'idle',
                NULL,
                '2026-04-18T00:00:00.000Z',
                '2026-04-18T00:00:00.000Z'
            );
        `);
        legacyClient.client.close();

        const upgradedClient = await createDatabaseClient({ databasePath });
        await runDatabaseMigrations(upgradedClient, migrationsFolder);

        await expect(
            upgradedClient.client.execute(
                'SELECT reminder_lead_minutes_json FROM integration_calendars WHERE id = ?',
                ['google:user-1:primary'],
            ),
        ).resolves.toMatchObject({
            rows: [{ reminder_lead_minutes_json: '[30]' }],
        });

        upgradedClient.client.close();
    });
});
