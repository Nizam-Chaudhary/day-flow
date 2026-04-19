import { bootstrapDatabase } from '@/main/db/migrate';
import { getGoogleCalendarService } from '@/main/google-calendar/google-calendar-service';
import { registerIpcHandlers } from '@/main/ipc/register-ipc';

export async function bootstrapMainProcess(): Promise<void> {
    bootstrapDatabase();
    registerIpcHandlers({
        googleCalendarService: getGoogleCalendarService(),
    });
}
