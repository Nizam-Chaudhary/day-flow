import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
            routesDirectory: './src/pages',
            generatedRouteTree: './src/routeTree.gen.ts',
            quoteStyle: 'single',
            routeFileIgnorePattern: '.test.tsx',
        }),
        tailwindcss(),
        react(),
    ],
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
