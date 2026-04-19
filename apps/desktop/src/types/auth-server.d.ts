declare module '@day-flow/auth-server/google-auth-server' {
    export interface CreateGoogleAuthServerOptions {
        host?: string;
        port?: number;
    }

    export interface RunningGoogleAuthServer {
        baseUrl: string;
        close(): Promise<void>;
        port: number;
    }

    export function startGoogleAuthServer(
        options?: CreateGoogleAuthServerOptions,
    ): Promise<RunningGoogleAuthServer>;
}
