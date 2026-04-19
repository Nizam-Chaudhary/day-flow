import { describe, expect, it, vi } from 'vitest';

import type { AppPreferences, UpdateAppPreferencesInput } from '@/shared/contracts/settings';

import { createIpcHandlers } from '@/main/ipc/register-ipc';
import {
    APP_GET_HEALTH_CHANNEL,
    GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from '@/shared/channels';
import { createDayFlowError } from '@/shared/errors';

describe('createIpcHandlers', () => {
    it('wraps successful responses in the shared IPC result shape', async () => {
        const handlers = createIpcHandlers({
            getHealth: () => ({
                databasePath: '/tmp/day-flow.sqlite',
                databaseReady: true,
                lastMigrationAt: '2026-04-18T00:00:00.000Z',
            }),
            settingsService: {
                getPreferences: vi.fn<() => AppPreferences>(() => ({
                    createdAt: '2026-04-18T00:00:00.000Z',
                    dayStartsAt: '08:00',
                    defaultCalendarView: 'week',
                    updatedAt: '2026-04-18T00:00:00.000Z',
                    weekStartsOn: 1,
                })),
                updatePreferences: vi.fn<(input: UpdateAppPreferencesInput) => AppPreferences>(
                    (input) => ({
                        createdAt: '2026-04-18T00:00:00.000Z',
                        updatedAt: '2026-04-18T00:00:01.000Z',
                        ...input,
                    }),
                ),
            },
            googleCalendarService: {
                disconnectConnection: vi
                    .fn<(connectionId: string) => Promise<void>>()
                    .mockResolvedValue(undefined),
                getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
                listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                startConnection: vi.fn<() => Promise<never>>(),
                syncConnection: vi.fn<(connectionId: string) => Promise<never>>(),
                updateCalendar: vi.fn<(input: never) => Promise<never>>(),
                updateConnection: vi.fn<(input: never) => Promise<never>>(),
            },
        });

        await expect(handlers[APP_GET_HEALTH_CHANNEL]({} as never)).resolves.toEqual({
            data: {
                databasePath: '/tmp/day-flow.sqlite',
                databaseReady: true,
                lastMigrationAt: '2026-04-18T00:00:00.000Z',
            },
            ok: true,
        });

        await expect(handlers[SETTINGS_GET_CHANNEL]({} as never)).resolves.toEqual({
            data: {
                createdAt: '2026-04-18T00:00:00.000Z',
                dayStartsAt: '08:00',
                defaultCalendarView: 'week',
                updatedAt: '2026-04-18T00:00:00.000Z',
                weekStartsOn: 1,
            },
            ok: true,
        });

        await expect(
            handlers[SETTINGS_UPDATE_CHANNEL]({} as never, {
                dayStartsAt: '09:00',
                defaultCalendarView: 'day',
                weekStartsOn: 0,
            }),
        ).resolves.toEqual({
            data: {
                createdAt: '2026-04-18T00:00:00.000Z',
                dayStartsAt: '09:00',
                defaultCalendarView: 'day',
                updatedAt: '2026-04-18T00:00:01.000Z',
                weekStartsOn: 0,
            },
            ok: true,
        });

        await expect(
            handlers[GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL]({} as never),
        ).resolves.toEqual({
            data: [],
            ok: true,
        });

        await expect(
            handlers[GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL]({} as never, 'google:user-1'),
        ).resolves.toEqual({
            data: undefined,
            ok: true,
        });
    });

    it('serializes service failures into safe errors', async () => {
        const handlers = createIpcHandlers({
            settingsService: {
                getPreferences: vi.fn<() => AppPreferences>(() => {
                    throw createDayFlowError('INVALID_INPUT', 'Broken settings payload.');
                }),
                updatePreferences: vi.fn<(input: UpdateAppPreferencesInput) => AppPreferences>(),
            },
            googleCalendarService: {
                disconnectConnection: vi.fn<(connectionId: string) => Promise<void>>(),
                getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
                listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                startConnection: vi.fn<() => Promise<never>>(),
                syncConnection: vi.fn<(connectionId: string) => Promise<never>>(),
                updateCalendar: vi.fn<(input: never) => Promise<never>>(),
                updateConnection: vi.fn<(input: never) => Promise<never>>(),
            },
        });

        await expect(handlers[SETTINGS_GET_CHANNEL]({} as never)).resolves.toEqual({
            error: {
                code: 'INVALID_INPUT',
                message: 'Broken settings payload.',
            },
            ok: false,
        });
    });
});
