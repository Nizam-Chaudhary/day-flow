import { z } from 'zod';

export const appHealthSchema = z.object({
    databaseReady: z.boolean(),
    databasePath: z.string(),
    lastMigrationAt: z.string().optional(),
});

export type AppHealth = z.infer<typeof appHealthSchema>;
