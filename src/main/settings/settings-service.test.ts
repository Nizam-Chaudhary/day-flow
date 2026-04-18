import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createDatabaseClient } from "@/main/db/client";
import { runDatabaseMigrations } from "@/main/db/migrate";
import { createSettingsService } from "@/main/settings/settings-service";

const migrationsFolder = join(process.cwd(), "drizzle");
const cleanupPaths = new Set<string>();

afterEach(() => {
    for (const cleanupPath of cleanupPaths) {
        rmSync(cleanupPath, { force: true, recursive: true });
    }

    cleanupPaths.clear();
});

describe("createSettingsService", () => {
    it("creates default preferences and persists updates", () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), "day-flow-settings-"));
        const databasePath = join(tempDirectory, "preferences.sqlite");
        const client = createDatabaseClient({ databasePath });

        cleanupPaths.add(tempDirectory);

        runDatabaseMigrations(client, migrationsFolder);

        const settingsService = createSettingsService(client);

        expect(settingsService.getPreferences()).toMatchObject({
            dayStartsAt: "08:00",
            defaultCalendarView: "week",
            weekStartsOn: 1,
        });

        const updatedPreferences = settingsService.updatePreferences({
            dayStartsAt: "07:30",
            defaultCalendarView: "month",
            weekStartsOn: 0,
        });

        expect(updatedPreferences).toMatchObject({
            dayStartsAt: "07:30",
            defaultCalendarView: "month",
            weekStartsOn: 0,
        });
        expect(settingsService.getPreferences()).toMatchObject(updatedPreferences);

        client.sqlite.close();
    });
});
