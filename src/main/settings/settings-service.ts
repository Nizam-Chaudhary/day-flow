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
    getPreferences(): AppPreferences;
    updatePreferences(input: UpdateAppPreferencesInput): AppPreferences;
}

export function createSettingsService(
    client: DatabaseClient = getDatabaseClient(),
): SettingsService {
    const selectPreferencesRow = (): AppPreferencesRow | undefined =>
        client.db.select().from(appPreferencesTable).where(eq(appPreferencesTable.id, 1)).get();

    const ensurePreferencesRow = (): AppPreferencesRow => {
        const existingPreferences = selectPreferencesRow();

        if (existingPreferences) {
            return existingPreferences;
        }

        const timestamp = new Date().toISOString();
        const preferencesToInsert: AppPreferencesRow = {
            id: 1,
            ...DEFAULT_APP_PREFERENCES_INPUT,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        client.db.insert(appPreferencesTable).values(preferencesToInsert).run();

        return preferencesToInsert;
    };

    return {
        getPreferences() {
            try {
                return mapAppPreferencesRow(ensurePreferencesRow());
            } catch (error) {
                throw normalizeDayFlowError(error, 'DATABASE_ERROR');
            }
        },
        updatePreferences(input) {
            validateUpdateAppPreferencesInput(input);

            try {
                const existingPreferences = ensurePreferencesRow();
                const updatedAt = new Date().toISOString();

                client.db
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

                const updatedPreferences = selectPreferencesRow();

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
