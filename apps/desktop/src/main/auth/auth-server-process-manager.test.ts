import type { ChildProcessWithoutNullStreams } from 'node:child_process';

import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@day-flow/env/index', () => ({
    env: {
        DAY_FLOW_AUTH_HOST: '127.0.0.1',
    },
}));

import { createAuthServerProcessManager } from '@/main/auth/auth-server-process-manager';

function createChildProcessStub() {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const listeners = new Map<string, Set<(...args: any[]) => void>>();
    const child = {
        exitCode: null as number | null,
        kill: vi.fn<(signal?: NodeJS.Signals | number) => boolean>(
            (signal?: NodeJS.Signals | number) => {
                child.exitCode = 0;
                emit('exit', 0, typeof signal === 'string' ? signal : null);

                return true;
            },
        ),
        off(event: string, listener: (...args: any[]) => void) {
            listeners.get(event)?.delete(listener);

            return child;
        },
        on(event: string, listener: (...args: any[]) => void) {
            const registeredListeners = listeners.get(event) ?? new Set();
            registeredListeners.add(listener);
            listeners.set(event, registeredListeners);

            return child;
        },
        once(event: string, listener: (...args: any[]) => void) {
            const wrappedListener = (...args: any[]) => {
                child.off(event, wrappedListener);
                listener(...args);
            };

            return child.on(event, wrappedListener);
        },
        stderr,
        stdout,
    };

    const emit = (event: string, ...args: any[]) => {
        for (const listener of listeners.get(event) ?? []) {
            listener(...args);
        }
    };

    return {
        child: child as unknown as ChildProcessWithoutNullStreams,
        emitError(error: Error) {
            emit('error', error);
        },
        emitExit(code: number | null, signal: NodeJS.Signals | null = null) {
            child.exitCode = code;
            emit('exit', code, signal);
        },
        emitReady(baseUrl = 'http://127.0.0.1:8787') {
            stdout.write(`Day Flow auth server listening on ${baseUrl}\n`);
        },
        killMock: child.kill,
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('createAuthServerProcessManager', () => {
    it('starts the auth server only once for concurrent callers', async () => {
        const processStub = createChildProcessStub();
        const spawnProcess = vi.fn<
            (
                command: string,
                args: string[],
                options: {
                    cwd: string;
                    env: NodeJS.ProcessEnv;
                    stdio: 'pipe';
                },
            ) => ChildProcessWithoutNullStreams
        >(() => processStub.child);
        const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
            }),
        );
        const manager = createAuthServerProcessManager({
            fetchImpl,
            isPackaged: false,
            resolveScriptArgs: async () => ({
                args: ['auth-server.ts'],
                cwd: '/tmp/auth-server',
            }),
            spawnProcess,
        });

        const firstStart = manager.ensureStarted();
        const secondStart = manager.ensureStarted();

        processStub.emitReady();

        await expect(firstStart).resolves.toEqual({
            baseUrl: 'http://127.0.0.1:8787',
            port: 8787,
        });
        await expect(secondStart).resolves.toEqual({
            baseUrl: 'http://127.0.0.1:8787',
            port: 8787,
        });
        expect(spawnProcess).toHaveBeenCalledTimes(1);
        expect(spawnProcess).toHaveBeenCalledWith(
            expect.any(String),
            ['auth-server.ts'],
            expect.objectContaining({
                cwd: '/tmp/auth-server',
                env: expect.objectContaining({
                    DAY_FLOW_AUTH_HOST: '127.0.0.1',
                    DAY_FLOW_AUTH_PORT: '0',
                    ELECTRON_RUN_AS_NODE: '1',
                }),
                stdio: 'pipe',
            }),
        );
        expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:8787/healthz');
    });

    it('stops the running child process on shutdown', async () => {
        const processStub = createChildProcessStub();
        const manager = createAuthServerProcessManager({
            fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
                new Response(JSON.stringify({ ok: true }), {
                    status: 200,
                }),
            ),
            isPackaged: false,
            resolveScriptArgs: async () => ({
                args: ['auth-server.ts'],
                cwd: '/tmp/auth-server',
            }),
            spawnProcess: vi.fn<
                (
                    command: string,
                    args: string[],
                    options: {
                        cwd: string;
                        env: NodeJS.ProcessEnv;
                        stdio: 'pipe';
                    },
                ) => ChildProcessWithoutNullStreams
            >(() => processStub.child),
        });

        const startPromise = manager.ensureStarted();

        processStub.emitReady('http://127.0.0.1:8788');
        await startPromise;

        await manager.stop();

        expect(processStub.killMock).toHaveBeenCalledTimes(1);
    });
});
