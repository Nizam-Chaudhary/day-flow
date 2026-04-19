export {
    createGoogleAuthServerApp,
    startGoogleAuthServer,
} from '@day-flow/auth-server/google-auth-server';
export type {
    CreateGoogleAuthServerOptions,
    RunningGoogleAuthServer,
} from '@day-flow/auth-server/google-auth-server';

import { startGoogleAuthServer } from '@day-flow/auth-server/google-auth-server';

const server = await startGoogleAuthServer({
    host: process.env.DAY_FLOW_AUTH_HOST ?? '127.0.0.1',
    port: process.env.DAY_FLOW_AUTH_PORT ? Number(process.env.DAY_FLOW_AUTH_PORT) : 8787,
});

console.log(`Day Flow auth server listening on ${server.baseUrl}`);
