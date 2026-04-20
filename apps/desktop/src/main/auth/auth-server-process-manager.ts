import { env } from '@day-flow/env/index';
import { app } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const AUTH_SERVER_PORT = '0';
const AUTH_SERVER_READY_PATTERN = /Day Flow auth server listening on (http:\/\/\S+)/;
const AUTH_SERVER_START_TIMEOUT_MS = 10_000;

export interface RunningAuthServer {
    baseUrl: string;
    port: number;
}

export interface AuthServerRuntime {
    ensureStarted(): Promise<RunningAuthServer>;
    stop(): Promise<void>;
}

interface AuthServerProcessManagerOptions {
    fetchImpl?: typeof fetch;
    isPackaged?: boolean;
    resourcesPath?: string;
    resolveScriptArgs?: (input: {
        isPackaged: boolean;
        resourcesPath: string;
    }) => Promise<ResolvedAuthServerScript>;
    spawnProcess?: (
        command: string,
        args: string[],
        options: {
            cwd: string;
            env: NodeJS.ProcessEnv;
            stdio: 'pipe';
        },
    ) => ChildProcessWithoutNullStreams;
    startupTimeoutMs?: number;
}

interface ResolvedAuthServerScript {
    args: string[];
    cwd: string;
}

export function createAuthServerProcessManager({
    fetchImpl = fetch,
    isPackaged = app.isPackaged,
    resourcesPath = process.resourcesPath,
    resolveScriptArgs = getAuthServerProcessArgs,
    spawnProcess = (command, args, options) => spawn(command, args, options),
    startupTimeoutMs = AUTH_SERVER_START_TIMEOUT_MS,
}: AuthServerProcessManagerOptions = {}): AuthServerRuntime {
    let startupPromise: Promise<RunningAuthServer> | undefined;
    let activeProcess: ChildProcessWithoutNullStreams | undefined;
    let runningServer: RunningAuthServer | undefined;

    return {
        async ensureStarted() {
            if (runningServer) {
                return runningServer;
            }

            if (!startupPromise) {
                startupPromise = startAuthServerProcess({
                    fetchImpl,
                    isPackaged,
                    onProcess: (child) => {
                        activeProcess = child;
                    },
                    resourcesPath,
                    resolveScriptArgs,
                    spawnProcess,
                    startupTimeoutMs,
                })
                    .then((server) => {
                        activeProcess?.once('exit', () => {
                            activeProcess = undefined;
                            runningServer = undefined;
                        });
                        runningServer = server;
                        startupPromise = undefined;

                        return server;
                    })
                    .catch((error) => {
                        startupPromise = undefined;
                        runningServer = undefined;

                        if (activeProcess) {
                            const child = activeProcess;
                            activeProcess = undefined;
                            child.kill();
                        }

                        throw error;
                    });
            }

            return startupPromise;
        },
        async stop() {
            startupPromise = undefined;
            runningServer = undefined;

            if (!activeProcess) {
                return;
            }

            const child = activeProcess;
            activeProcess = undefined;

            await new Promise<void>((resolve) => {
                if (child.exitCode !== null) {
                    resolve();
                    return;
                }

                child.once('exit', () => resolve());
                child.kill();
            });
        },
    };
}

async function startAuthServerProcess({
    fetchImpl,
    isPackaged,
    onProcess,
    resourcesPath,
    resolveScriptArgs,
    spawnProcess,
    startupTimeoutMs,
}: {
    fetchImpl: typeof fetch;
    isPackaged: boolean;
    onProcess: (child: ChildProcessWithoutNullStreams) => void;
    resourcesPath: string;
    resolveScriptArgs: NonNullable<AuthServerProcessManagerOptions['resolveScriptArgs']>;
    spawnProcess: NonNullable<AuthServerProcessManagerOptions['spawnProcess']>;
    startupTimeoutMs: number;
}): Promise<RunningAuthServer> {
    const command = process.execPath;
    const { args, cwd } = await resolveScriptArgs({
        isPackaged,
        resourcesPath,
    });
    const child = spawnProcess(command, args, {
        cwd,
        env: {
            ...process.env,
            DAY_FLOW_AUTH_HOST: env.DAY_FLOW_AUTH_HOST,
            DAY_FLOW_AUTH_PORT: AUTH_SERVER_PORT,
            ELECTRON_RUN_AS_NODE: '1',
        },
        stdio: 'pipe',
    });

    onProcess(child);

    return await new Promise<RunningAuthServer>((resolve, reject) => {
        const stderrLines: string[] = [];
        let stdoutBuffer = '';
        let settled = false;

        const cleanup = () => {
            clearTimeout(timeoutId);
            child.stdout.off('data', handleStdout);
            child.stderr.off('data', handleStderr);
            child.off('exit', handleExit);
            child.off('error', handleError);
        };

        const fail = (error: Error) => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            reject(error);
        };

        const complete = async (server: RunningAuthServer) => {
            if (settled) {
                return;
            }

            try {
                await verifyAuthServerHealth(server.baseUrl, fetchImpl);
                settled = true;
                cleanup();
                resolve(server);
            } catch (error) {
                fail(
                    error instanceof Error
                        ? error
                        : new Error('Auth server failed its startup health check.'),
                );
            }
        };

        const handleStdout = (chunk: Buffer | string) => {
            stdoutBuffer += chunk.toString();
            const lines = stdoutBuffer.split(/\r?\n/);

            stdoutBuffer = lines.pop() ?? '';

            for (const line of lines) {
                const match = line.match(AUTH_SERVER_READY_PATTERN);

                if (!match) {
                    continue;
                }

                const baseUrl = match[1];
                const port = Number(new URL(baseUrl).port);

                void complete({
                    baseUrl,
                    port,
                });
                return;
            }
        };

        const handleStderr = (chunk: Buffer | string) => {
            stderrLines.push(chunk.toString().trim());
        };

        const handleExit = (code: number | null, signal: NodeJS.Signals | null) => {
            fail(
                new Error(
                    [
                        `Auth server exited before it became ready (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`,
                        stderrLines.filter(Boolean).join('\n'),
                    ]
                        .filter(Boolean)
                        .join('\n'),
                ),
            );
        };

        const handleError = (error: Error) => {
            fail(error);
        };

        const timeoutId = setTimeout(() => {
            fail(new Error('Timed out while starting the auth server.'));
        }, startupTimeoutMs);

        child.stdout.on('data', handleStdout);
        child.stderr.on('data', handleStderr);
        child.once('exit', handleExit);
        child.once('error', handleError);
    });
}

async function getAuthServerProcessArgs({
    isPackaged,
    resourcesPath,
}: {
    isPackaged: boolean;
    resourcesPath: string;
}): Promise<ResolvedAuthServerScript> {
    const scriptPath = isPackaged
        ? path.join(resourcesPath, 'auth-server', 'dist', 'index.js')
        : path.resolve(process.cwd(), '..', 'auth-server', 'src', 'index.ts');

    await access(scriptPath);

    if (isPackaged) {
        return {
            args: [scriptPath],
            cwd: path.dirname(scriptPath),
        };
    }

    return {
        args: ['--import', resolveTsxCliPath(), scriptPath],
        cwd: path.dirname(scriptPath),
    };
}

function resolveTsxCliPath() {
    const require = createRequire(import.meta.url);
    const tsxPackageJsonPath = require.resolve('tsx/package.json');

    return path.join(path.dirname(tsxPackageJsonPath), 'dist', 'cli.mjs');
}

async function verifyAuthServerHealth(baseUrl: string, fetchImpl: typeof fetch) {
    const response = await fetchImpl(`${baseUrl}/healthz`);

    if (!response.ok) {
        throw new Error('Auth server health check failed.');
    }
}
