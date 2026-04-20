export {
    createGoogleAuthServerApp,
    startGoogleAuthServer,
} from '@day-flow/auth-server/google-auth-server';
export type {
    CreateGoogleAuthServerOptions,
    RunningGoogleAuthServer,
} from '@day-flow/auth-server/google-auth-server';
import { startGoogleAuthServer } from '@day-flow/auth-server/google-auth-server';
import { env } from '@day-flow/env/index';

const server = await startGoogleAuthServer({
    host: env.DAY_FLOW_AUTH_HOST,
    port: env.DAY_FLOW_AUTH_PORT,
});

console.log(`Day Flow auth server listening on ${server.baseUrl}`);
