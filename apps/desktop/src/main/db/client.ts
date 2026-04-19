import { getDatabasePath } from '@/main/db/paths';

export * from '@day-flow/db/client';

import { getOrCreateDatabaseClient } from '@day-flow/db/client';

export async function getDatabaseClient() {
    return await getOrCreateDatabaseClient(getDatabasePath());
}
