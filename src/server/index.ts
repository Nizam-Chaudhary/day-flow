import type { ServerType } from '@hono/node-server';

import { serve } from '@hono/node-server';
import { createServer } from 'node:net';

import { createServerApp } from '@/server/create-server';

export interface ServerRuntime {
    ensureStarted(): Promise<RunningServer>;
    stop(): Promise<void>;
}

export interface RunningServer {
    baseUrl: string;
    port: number;
}

export interface CreateServerRuntimeOptions {
    fetchImpl?: typeof fetch;
    host?: string;
    port?: number;
}

export function createServerRuntime({
    fetchImpl = fetch,
    host = '127.0.0.1',
    port = 0,
}: CreateServerRuntimeOptions = {}): ServerRuntime {
    let activeServer: ServerType | undefined;
    let runningServer: RunningServer | undefined;
    let startupPromise: Promise<RunningServer> | undefined;

    return {
        async ensureStarted() {
            if (runningServer) {
                return runningServer;
            }

            startupPromise ??= startServer({
                fetchImpl,
                host,
                port,
            }).then((server) => {
                activeServer = server.server;
                runningServer = server.runningServer;
                startupPromise = undefined;

                return server.runningServer;
            });

            return startupPromise;
        },
        async stop() {
            startupPromise = undefined;
            runningServer = undefined;

            if (!activeServer) {
                return;
            }

            const server = activeServer;
            activeServer = undefined;

            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        },
    };
}

async function startServer({
    fetchImpl,
    host,
    port,
}: {
    fetchImpl: typeof fetch;
    host: string;
    port: number;
}) {
    const actualPort = await resolvePort(host, port);
    const runningServer = {
        baseUrl: `http://${host}:${actualPort}`,
        port: actualPort,
    };
    const app = createServerApp(runningServer.baseUrl);
    const server = serve({
        fetch: app.fetch,
        hostname: host,
        port: actualPort,
    });

    await verifyServerHealth(runningServer.baseUrl, fetchImpl);

    return {
        runningServer,
        server,
    };
}

async function resolvePort(host: string, port: number): Promise<number> {
    if (port !== 0) {
        return port;
    }

    return await new Promise<number>((resolve, reject) => {
        const server = createServer();

        server.once('error', reject);
        server.listen(0, host, () => {
            const address = server.address();

            if (!address || typeof address === 'string') {
                server.close();
                reject(new Error('Failed to resolve auth server port.'));
                return;
            }

            const resolvedPort = address.port;

            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(resolvedPort);
            });
        });
    });
}

async function verifyServerHealth(baseUrl: string, fetchImpl: typeof fetch): Promise<void> {
    const response = await fetchImpl(`${baseUrl}/healthz`);

    if (!response.ok) {
        throw new Error('Server failed its startup health check.');
    }
}
