import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    APP_DATA_DIRECTORY_NAME,
    APP_DATABASE_FILENAME,
    resolveAppDataDirectoryPath,
    resolveAppDatabasePath,
    resolveElectronUserDataPath,
} from '@/db/storage-paths';

describe('storage paths', () => {
    it('uses day-flow as the canonical app data directory name', () => {
        expect(APP_DATA_DIRECTORY_NAME).toBe('day-flow');
    });

    it('resolves the app database inside the app data directory', () => {
        expect(resolveAppDatabasePath('/tmp/day-flow')).toBe('/tmp/day-flow/day-flow.sqlite');
        expect(APP_DATABASE_FILENAME).toBe('day-flow.sqlite');
    });

    it('resolves Electron userData to the day-flow directory', () => {
        expect(resolveElectronUserDataPath(join('/tmp', 'Day Flow'))).toBe(
            join('/tmp', 'day-flow'),
        );
    });

    it('builds the app data directory from a base path', () => {
        expect(resolveAppDataDirectoryPath('/tmp')).toBe('/tmp/day-flow');
    });
});
