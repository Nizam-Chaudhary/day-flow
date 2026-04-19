import { startGoogleAuthServer } from './google-auth-server';

const server = await startGoogleAuthServer({
    host: process.env.DAY_FLOW_AUTH_HOST ?? '127.0.0.1',
    port: process.env.DAY_FLOW_AUTH_PORT ? Number(process.env.DAY_FLOW_AUTH_PORT) : 8787,
});

console.log(`Day Flow auth server listening on ${server.baseUrl}`);
