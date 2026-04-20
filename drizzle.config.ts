import { defineConfig } from 'drizzle-kit';

import {
    resolveAppDataDirectoryPath,
    resolveAppDatabasePath,
    resolvePlatformAppDataPath,
} from './src/db/storage-paths';

const appDatabasePath = resolveAppDatabasePath(
    resolveAppDataDirectoryPath(resolvePlatformAppDataPath()),
);

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dbCredentials: {
        url: `file:${appDatabasePath}`,
    },
    casing: 'snake_case',
});
