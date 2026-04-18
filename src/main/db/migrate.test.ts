import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabaseClient } from "@/main/db/client";
import { runDatabaseMigrations } from "@/main/db/migrate";

const migrationsFolder = join(process.cwd(), "drizzle");
const cleanupPaths = new Set<string>();

afterEach(() => {
    for (const cleanupPath of cleanupPaths) {
        rmSync(cleanupPath, { force: true, recursive: true });
    }

    cleanupPaths.clear();
});

describe("runDatabaseMigrations", () => {
    it("is idempotent across repeated starts", () => {
        const tempDirectory = mkdtempSync(join(tmpdir(), "day-flow-migrate-"));
        const databasePath = join(tempDirectory, "app.sqlite");

        cleanupPaths.add(tempDirectory);

        const firstClient = createDatabaseClient({ databasePath });
        const firstHealth = runDatabaseMigrations(firstClient, migrationsFolder);

        expect(firstHealth.databaseReady).toBe(true);
        firstClient.sqlite.close();

        const secondClient = createDatabaseClient({ databasePath });

        expect(() => runDatabaseMigrations(secondClient, migrationsFolder)).not.toThrow();
        expect(
            secondClient.sqlite
                .prepare(
                    "select name from sqlite_master where type = 'table' and name = 'app_preferences'",
                )
                .get(),
        ).toBeTruthy();

        secondClient.sqlite.close();
    });
});
