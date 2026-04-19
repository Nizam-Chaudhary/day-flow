import { defineConfig } from 'drizzle-kit';
import { homedir } from 'node:os';
import { join } from 'node:path';

function resolveAppDataPath(): string {
    switch (process.platform) {
        case 'darwin':
            return join(homedir(), 'Library', 'Application Support');
        case 'win32':
            return process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
        default:
            return process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
    }
}

const appDatabasePath = join(resolveAppDataPath(), 'Day Flow', 'day-flow.sqlite');

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/schema.ts',
    out: './drizzle',
    dbCredentials: {
        url: `file:${appDatabasePath}`,
    },
    casing: 'snake_case',
});
