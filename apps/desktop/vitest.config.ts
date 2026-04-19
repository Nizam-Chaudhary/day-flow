import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@day-flow/auth-server': fileURLToPath(new URL('../auth-server/src', import.meta.url)),
            '@day-flow/contracts': fileURLToPath(
                new URL('../../packages/contracts/src', import.meta.url),
            ),
            '@day-flow/db': fileURLToPath(new URL('../../packages/db/src', import.meta.url)),
            '@day-flow/integrations-google': fileURLToPath(
                new URL('../../packages/integrations-google/src', import.meta.url),
            ),
        },
    },
    test: {
        clearMocks: true,
        environment: 'node',
        restoreMocks: true,
        setupFiles: ['./src/test/setup.ts'],
    },
});
