import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            external: ['better-sqlite3'],
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@day-flow/contracts': fileURLToPath(
                new URL('../../packages/contracts/src', import.meta.url),
            ),
            '@day-flow/db': fileURLToPath(new URL('../../packages/db/src', import.meta.url)),
            '@day-flow/integrations-google': fileURLToPath(
                new URL('../../packages/integrations-google/src', import.meta.url),
            ),
        },
    },
});
