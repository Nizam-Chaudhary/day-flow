import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@day-flow/contracts': fileURLToPath(
                new URL('../../packages/contracts/src', import.meta.url),
            ),
        },
    },
});
