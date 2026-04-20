import { describe, expect, it } from 'vitest';

import {
    resolveAppDataDirectoryPath,
    resolveAppDatabasePath,
    resolvePlatformAppDataPath,
} from '@/db/storage-paths';

import config from '../../drizzle.config';

describe('drizzle config', () => {
    it('targets the day-flow app data directory', () => {
        const configUrl = (
            config as {
                dbCredentials: {
                    url: string;
                };
            }
        ).dbCredentials.url;

        expect(configUrl).toBe(
            `file:${resolveAppDatabasePath(
                resolveAppDataDirectoryPath(resolvePlatformAppDataPath()),
            )}`,
        );
    });
});
