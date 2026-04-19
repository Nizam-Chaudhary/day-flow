import { app } from 'electron';

import { createAuthServerProcessManager } from '@/main/auth/auth-server-process-manager';
import { bootstrapDatabase } from '@/main/db/migrate';
import { getGoogleCalendarService } from '@/main/google-calendar/google-calendar-service';
import { registerIpcHandlers } from '@/main/ipc/register-ipc';

export async function bootstrapMainProcess(): Promise<void> {
    const authServerRuntime = createAuthServerProcessManager();

    app.once('before-quit', () => {
        void authServerRuntime.stop();
    });
    process.once('exit', () => {
        void authServerRuntime.stop();
    });

    void bootstrapDatabase();
    registerIpcHandlers({
        googleCalendarService: getGoogleCalendarService({
            authServerRuntime,
        }),
    });
}
