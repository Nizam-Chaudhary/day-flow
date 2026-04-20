import { afterEach, describe, expect, it, vi } from 'vitest';

import { createServerRuntime } from '@/server';

afterEach(() => {
    vi.useRealTimers();
});

describe('createServerRuntime', () => {
    it('starts the server only once for concurrent callers', async () => {
        const runtime = createServerRuntime({
            host: '127.0.0.1',
            port: 0,
        });

        const firstStart = runtime.ensureStarted();
        const secondStart = runtime.ensureStarted();
        const firstServer = await firstStart;
        const secondServer = await secondStart;

        expect(firstServer.baseUrl).toBe(secondServer.baseUrl);
        expect(firstServer.port).toBe(secondServer.port);
        expect(firstServer.port).toBeGreaterThan(0);
        await expect(fetch(`${firstServer.baseUrl}/healthz`)).resolves.toMatchObject({
            ok: true,
            status: 200,
        });

        await runtime.stop();
    });

    it('stops the running server cleanly', async () => {
        const runtime = createServerRuntime({
            host: '127.0.0.1',
            port: 0,
        });

        const runningServer = await runtime.ensureStarted();

        await expect(fetch(`${runningServer.baseUrl}/healthz`)).resolves.toMatchObject({
            ok: true,
            status: 200,
        });

        await runtime.stop();
        await expect(fetch(`${runningServer.baseUrl}/healthz`)).rejects.toBeTruthy();
    });
});
