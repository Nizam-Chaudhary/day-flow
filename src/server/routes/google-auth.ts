import type { z } from 'zod';

import { Hono } from 'hono';
import { html } from 'hono/html';
import { createHash, randomBytes } from 'node:crypto';

import {
    createGoogleOAuthFlowInputSchema,
    googleOAuthFlowResultSchema,
} from '@/schemas/contracts/google-calendar';

type GoogleFlowRecord = z.infer<typeof googleOAuthFlowResultSchema> & {
    codeVerifier: string;
    consumedAt?: string;
    redirectUri: string;
};

export function createGoogleAuthRoutes(baseUrl: string) {
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

        const body = createGoogleOAuthFlowInputSchema.parse(await context.req.json());
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

    return app;
}

function renderCallbackPage({ description, title }: { description: string; title: string }) {
    return html`<!doctype html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${title}</title>
                <style>
                    :root {
                        color-scheme: dark;
                        font-family: Figtree, system-ui, sans-serif;
                    }
                    body {
                        margin: 0;
                        min-height: 100vh;
                        display: grid;
                        place-items: center;
                        background:
                            radial-gradient(
                                circle at top,
                                rgba(74, 222, 128, 0.18),
                                transparent 40%
                            ),
                            linear-gradient(180deg, #0a0f15, #121924);
                        color: #f8fafc;
                    }
                    main {
                        width: min(32rem, calc(100vw - 2rem));
                        border: 1px solid rgba(148, 163, 184, 0.2);
                        border-radius: 1.25rem;
                        padding: 2rem;
                        background: rgba(15, 23, 42, 0.9);
                        box-shadow: 0 20px 60px rgba(2, 6, 23, 0.45);
                    }
                    h1 {
                        margin: 0 0 0.75rem;
                        font-size: 1.5rem;
                    }
                    p {
                        margin: 0;
                        color: #cbd5e1;
                        line-height: 1.6;
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
