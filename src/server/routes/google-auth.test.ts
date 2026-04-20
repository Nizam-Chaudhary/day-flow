import { describe, expect, it } from 'vitest';

import { createServerRuntime } from '@/server';
import { createServerApp } from '@/server/create-server';

describe('createServerApp', () => {
    it('creates flows, completes callbacks, and enforces one-time polling', async () => {
        const app = createServerApp('http://127.0.0.1:9999');

        const createResponse = await app.request('http://127.0.0.1:9999/oauth/google/flows', {
            body: JSON.stringify({
                clientId: 'client-id',
                scopes: ['openid', 'email'],
            }),
            headers: {
                'content-type': 'application/json',
            },
            method: 'POST',
        });
        const flow = (await createResponse.json()) as {
            flowId: string;
            state: string;
        };

        const callbackResponse = await app.request(
            `http://127.0.0.1:9999/oauth/google/callback?state=${flow.state}&code=auth-code`,
        );

        expect(callbackResponse.status).toBe(200);

        const pollResponse = await app.request(
            `http://127.0.0.1:9999/oauth/google/flows/${flow.flowId}`,
        );
        const pollPayload = (await pollResponse.json()) as {
            code: string;
            status: string;
        };

        expect(pollPayload.status).toBe('completed');
        expect(pollPayload.code).toBe('auth-code');

        const consumedResponse = await app.request(
            `http://127.0.0.1:9999/oauth/google/flows/${flow.flowId}`,
        );

        expect(consumedResponse.status).toBe(410);
    });

    it('captures provider callback failures', async () => {
        const app = createServerApp('http://127.0.0.1:9999');

        const createResponse = await app.request('http://127.0.0.1:9999/oauth/google/flows', {
            body: JSON.stringify({
                clientId: 'client-id',
                scopes: ['openid', 'email'],
            }),
            headers: {
                'content-type': 'application/json',
            },
            method: 'POST',
        });
        const flow = (await createResponse.json()) as {
            flowId: string;
            state: string;
        };

        const callbackResponse = await app.request(
            `http://127.0.0.1:9999/oauth/google/callback?state=${flow.state}&error=access_denied&error_description=User%20denied%20consent`,
        );

        expect(callbackResponse.status).toBe(400);

        const pollResponse = await app.request(
            `http://127.0.0.1:9999/oauth/google/flows/${flow.flowId}`,
        );
        const pollPayload = (await pollResponse.json()) as {
            error: string;
            errorDescription: string;
            status: string;
        };

        expect(pollPayload.status).toBe('failed');
        expect(pollPayload.error).toBe('access_denied');
        expect(pollPayload.errorDescription).toBe('User denied consent');
    });

    it('starts an HTTP server on a random local port', async () => {
        const runtime = createServerRuntime({
            host: '127.0.0.1',
            port: 0,
        });
        const server = await runtime.ensureStarted();

        expect(server.port).toBeGreaterThan(0);
        await expect(fetch(`${server.baseUrl}/healthz`)).resolves.toMatchObject({
            ok: true,
            status: 200,
        });

        await runtime.stop();
    });
});
