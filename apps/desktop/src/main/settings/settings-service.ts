import { eq } from 'drizzle-orm';

import { type DatabaseClient, getDatabaseClient } from '@/main/db/client';
import { AppPreferencesRow, appPreferencesTable } from '@/main/db/schema';
import {
    type AppPreferences,
    DEFAULT_APP_PREFERENCES_INPUT,
    type UpdateAppPreferencesInput,
    isCalendarView,
    isTimeOfDay,
    isWeekStartsOn,
} from '@/shared/contracts/settings';
import { createDayFlowError, normalizeDayFlowError } from '@/shared/errors';

export interface SettingsService {
    getPreferences(): Promise<AppPreferences>;
    updatePreferences(input: UpdateAppPreferencesInput): Promise<AppPreferences>;
}

export function createSettingsService(
    clientPromise: DatabaseClient | Promise<DatabaseClient> = getDatabaseClient(),
): SettingsService {
    const getClient = async () => await clientPromise;

    const selectPreferencesRow = async (): Promise<AppPreferencesRow | undefined> => {
        const client = await getClient();

        return await client.db
            .select()
            .from(appPreferencesTable)
            .where(eq(appPreferencesTable.id, 1))
            .get();
    };

    const ensurePreferencesRow = async (): Promise<AppPreferencesRow> => {
        const existingPreferences = await selectPreferencesRow();

        if (existingPreferences) {
            return existingPreferences;
        }

        const client = await getClient();
        const timestamp = new Date().toISOString();
        const preferencesToInsert: AppPreferencesRow = {
            id: 1,
            ...DEFAULT_APP_PREFERENCES_INPUT,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        await client.db.insert(appPreferencesTable).values(preferencesToInsert).run();

        return preferencesToInsert;
    };

    return {
        async getPreferences() {
            try {
                return mapAppPreferencesRow(await ensurePreferencesRow());
            } catch (error) {
                throw normalizeDayFlowError(error, 'DATABASE_ERROR');
            }
        },
        async updatePreferences(input) {
            validateUpdateAppPreferencesInput(input);

            try {
                const client = await getClient();
                const existingPreferences = await ensurePreferencesRow();
                const updatedAt = new Date().toISOString();

                await client.db
                    .insert(appPreferencesTable)
                    .values({
                        ...existingPreferences,
                        ...input,
                        updatedAt,
                    })
                    .onConflictDoUpdate({
                        target: appPreferencesTable.id,
                        set: {
                            ...input,
                            updatedAt,
                        },
                    })
                    .run();

                const updatedPreferences = await selectPreferencesRow();

                if (!updatedPreferences) {
                    throw createDayFlowError(
                        'DATABASE_ERROR',
                        'Failed to load updated preferences.',
                    );
                }

                return mapAppPreferencesRow(updatedPreferences);
            } catch (error) {
                throw normalizeDayFlowError(error, 'DATABASE_ERROR');
            }
        },
    };
}

function validateUpdateAppPreferencesInput(input: UpdateAppPreferencesInput): void {
    if (!isCalendarView(input.defaultCalendarView)) {
        throw createDayFlowError('INVALID_INPUT', 'Invalid calendar view.');
    }

    if (!isWeekStartsOn(input.weekStartsOn)) {
        throw createDayFlowError('INVALID_INPUT', 'Invalid week start value.');
    }

    if (!isTimeOfDay(input.dayStartsAt)) {
        throw createDayFlowError('INVALID_INPUT', 'Invalid day start time.');
    }
}

function mapAppPreferencesRow(row: AppPreferencesRow): AppPreferences {
    return {
        defaultCalendarView: row.defaultCalendarView,
        weekStartsOn: row.weekStartsOn,
        dayStartsAt: row.dayStartsAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
