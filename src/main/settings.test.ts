import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createDatabaseClient } from '@/db/client';
import { runDatabaseMigrations } from '@/db/migrate';
import { createSettingsService } from '@/main/settings';

const migrationsFolder = join(process.cwd(), 'src', 'db', 'migrations');
const cleanupPaths = new Set<string>();

afterEach(() => {
    for (const cleanupPath of cleanupPaths) {
        rmSync(cleanupPath, { force: true, recursive: true });
    }

    cleanupPaths.clear();
});

describe('createSettingsService', () => {
    it('creates default preferences and persists updates', async () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), 'day-flow-settings-'));
        const databasePath = join(tempDirectory, 'preferences.sqlite');
        const client = await createDatabaseClient({ databasePath });

        cleanupPaths.add(tempDirectory);

        await runDatabaseMigrations(client, migrationsFolder);

        const settingsService = createSettingsService(client);

        await expect(settingsService.getPreferences()).resolves.toMatchObject({
            dayStartsAt: '08:00',
            defaultCalendarView: 'week',
            weekStartsOn: 1,
        });

        const updatedPreferences = await settingsService.updatePreferences({
            dayStartsAt: '07:30',
            defaultCalendarView: 'month',
            weekStartsOn: 0,
        });

        expect(updatedPreferences).toMatchObject({
            dayStartsAt: '07:30',
            defaultCalendarView: 'month',
            weekStartsOn: 0,
        });
        await expect(settingsService.getPreferences()).resolves.toMatchObject(updatedPreferences);

        client.client.close();
    });
});
