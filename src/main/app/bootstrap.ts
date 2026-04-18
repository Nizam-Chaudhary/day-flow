import { bootstrapDatabase } from '@/main/db/migrate';
import { registerIpcHandlers } from '@/main/ipc/register-ipc';

export async function bootstrapMainProcess(): Promise<void> {
    bootstrapDatabase();
    registerIpcHandlers();
}
