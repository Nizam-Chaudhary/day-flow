import { app } from 'electron';

import { bootstrapDatabase } from '@/db/migrate';
import { getGoogleCalendarService } from '@/main/google-calendar';
import { registerIpcHandlers } from '@/main/ipc';
import { createServerRuntime } from '@/server';

export async function bootstrapMainProcess(): Promise<void> {
    const authServerRuntime = createServerRuntime();

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
