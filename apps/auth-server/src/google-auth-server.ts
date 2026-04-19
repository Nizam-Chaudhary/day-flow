import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { html } from 'hono/html';
import { createHash, randomBytes } from 'node:crypto';

interface CreateFlowInput {
    clientId: string;
    scopes: string[];
}

interface GoogleFlowRecord {
    code?: string;
    codeVerifier: string;
    consumedAt?: string;
    error?: string;
    errorDescription?: string;
    expiresAt: string;
    flowId: string;
    redirectUri: string;
    state: string;
    status: 'completed' | 'failed' | 'pending';
}

export interface CreateGoogleAuthServerOptions {
    host?: string;
    port?: number;
}

export interface RunningGoogleAuthServer {
    baseUrl: string;
    close(): Promise<void>;
    port: number;
}

export function createGoogleAuthServerApp(baseUrl: string) {
    const app = new Hono();
    const flows = new Map<string, GoogleFlowRecord>();

    const pruneExpiredFlows = () => {
        const now = Date.now();

        for (const [flowId, flow] of flows.entries()) {
            if (new Date(flow.expiresAt).getTime() <= now) {
                flows.delete(flowId);
            }
        }
    };

    app.post('/oauth/google/flows', async (context) => {
        pruneExpiredFlows();

        const body = (await context.req.json()) as CreateFlowInput;
        const flowId = randomBytes(16).toString('hex');
        const state = randomBytes(16).toString('hex');
        const codeVerifier = randomBytes(32).toString('base64url');
        const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
        const redirectUri = `${baseUrl}/oauth/google/callback`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

        authUrl.searchParams.set('client_id', body.clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', body.scopes.join(' '));
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        flows.set(flowId, {
            codeVerifier,
            expiresAt,
            flowId,
            redirectUri,
            state,
            status: 'pending',
        });

        return context.json({
            authUrl: authUrl.toString(),
            codeVerifier,
            expiresAt,
            flowId,
            redirectUri,
            state,
        });
    });

    app.get('/oauth/google/callback', (context) => {
        pruneExpiredFlows();

        const state = context.req.query('state');
        const code = context.req.query('code');
        const error = context.req.query('error');
        const errorDescription = context.req.query('error_description');
        const flow = [...flows.values()].find((candidate) => candidate.state === state);

        if (!flow) {
            return context.html(
                renderCallbackPage({
                    description: 'This sign-in link is invalid or already expired.',
                    title: 'Google connection expired',
                }),
                400,
            );
        }

        if (new Date(flow.expiresAt).getTime() <= Date.now()) {
            flows.delete(flow.flowId);

            return context.html(
                renderCallbackPage({
                    description: 'This sign-in link expired. Return to Day Flow and try again.',
                    title: 'Google connection expired',
                }),
                400,
            );
        }

        if (error) {
            flows.set(flow.flowId, {
                ...flow,
                error,
                errorDescription,
                status: 'failed',
            });

            return context.html(
                renderCallbackPage({
                    description: errorDescription ?? 'Google returned an authorization error.',
                    title: 'Google connection failed',
                }),
                400,
            );
        }

        flows.set(flow.flowId, {
            ...flow,
            code,
            status: 'completed',
        });

        return context.html(
            renderCallbackPage({
                description: 'You can close this tab and return to Day Flow.',
                title: 'Google connection complete',
            }),
        );
    });

    app.get('/oauth/google/flows/:flowId', (context) => {
        pruneExpiredFlows();

        const flow = flows.get(context.req.param('flowId'));

        if (!flow) {
            return context.json(
                {
                    error: 'Flow not found.',
                    status: 'failed',
                },
                404,
            );
        }

        if (flow.consumedAt) {
            return context.json(
                {
                    error: 'Flow already consumed.',
                    expiresAt: flow.expiresAt,
                    flowId: flow.flowId,
                    status: 'failed',
                },
                410,
            );
        }

        if (flow.status === 'completed' || flow.status === 'failed') {
            flows.set(flow.flowId, {
                ...flow,
                consumedAt: new Date().toISOString(),
            });
        }

        return context.json(flow);
    });

    app.delete('/oauth/google/flows/:flowId', (context) => {
        flows.delete(context.req.param('flowId'));

        return context.body(null, 204);
    });

    app.get('/healthz', (context) =>
        context.json({
            ok: true,
        }),
    );

    return app;
}

export async function startGoogleAuthServer({
    host = '127.0.0.1',
    port = 0,
}: CreateGoogleAuthServerOptions = {}): Promise<RunningGoogleAuthServer> {
    const actualPort = await listenOnRandomPort(host, port);
    const baseUrl = `http://${host}:${actualPort}`;
    const app = createGoogleAuthServerApp(baseUrl);
    const server = serve({
        fetch: app.fetch,
        hostname: host,
        port: actualPort,
    });

    return {
        baseUrl,
        close: async () => {
            server.close();
        },
        port: actualPort,
    };
}

async function listenOnRandomPort(host: string, port: number): Promise<number> {
    if (port !== 0) {
        return port;
    }

    const { createServer } = await import('node:net');

    return new Promise<number>((resolve, reject) => {
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

function renderCallbackPage({ description, title }: { description: string; title: string }) {
    return html`<!doctype html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${title}</title>
                <style>
                    body {
                        background: #f8fafc;
                        color: #0f172a;
                        font-family: Inter, system-ui, sans-serif;
                        margin: 0;
                        min-height: 100vh;
                        display: grid;
                        place-items: center;
                        padding: 24px;
                    }
                    main {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 24px;
                        max-width: 520px;
                        padding: 32px;
                        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
                    }
                    h1 {
                        font-size: 1.5rem;
                        margin: 0 0 12px;
                    }
                    p {
                        color: #475569;
                        line-height: 1.6;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <main>
                    <h1>${title}</h1>
                    <p>${description}</p>
                </main>
            </body>
        </html>`;
}
