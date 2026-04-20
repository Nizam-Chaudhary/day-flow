import { Hono } from 'hono';

import { createGoogleAuthRoutes } from '@/server/routes/google-auth';

export function createServerApp(baseUrl: string) {
    const app = new Hono();

    app.route('/', createGoogleAuthRoutes(baseUrl));
    app.get('/healthz', (context) =>
        context.json({
            ok: true,
        }),
    );

    return app;
}
