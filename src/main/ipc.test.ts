import { describe, expect, it, vi } from 'vitest';

import type { AppPreferences, UpdateAppPreferencesInput } from '@/schemas/contracts/settings';

import {
    APP_GET_HEALTH_CHANNEL,
    GOOGLE_CALENDAR_DISCONNECT_CONNECTION_CHANNEL,
    GOOGLE_CALENDAR_LIST_CONNECTIONS_CHANNEL,
    GOOGLE_CALENDAR_LIST_EVENTS_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from '@/schemas/contracts/channels';
import { createDayFlowError } from '@/schemas/contracts/errors';

async function loadCreateIpcHandlers() {
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

    return (await import('@/main/ipc')).createIpcHandlers;
}

describe('createIpcHandlers', () => {
    it('wraps successful responses in the shared IPC result shape', async () => {
        const createIpcHandlers = await loadCreateIpcHandlers();
        const handlers = createIpcHandlers({
            getHealth: () => ({
                databasePath: '/tmp/day-flow.sqlite',
                databaseReady: true,
                lastMigrationAt: '2026-04-18T00:00:00.000Z',
            }),
            settingsService: {
                getPreferences: vi.fn<() => Promise<AppPreferences>>(async () => ({
                    createdAt: '2026-04-18T00:00:00.000Z',
                    dayStartsAt: '08:00',
                    defaultCalendarView: 'week',
                    updatedAt: '2026-04-18T00:00:00.000Z',
                    weekStartsOn: 1,
                })),
                updatePreferences: vi.fn<
                    (input: UpdateAppPreferencesInput) => Promise<AppPreferences>
                >(async (input) => ({
                    createdAt: '2026-04-18T00:00:00.000Z',
                    updatedAt: '2026-04-18T00:00:01.000Z',
                    ...input,
                })),
            },
            googleCalendarService: {
                disconnectConnection: vi
                    .fn<(connectionId: string) => Promise<void>>()
                    .mockResolvedValue(undefined),
                getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
                listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                listEvents: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
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
            handlers[GOOGLE_CALENDAR_LIST_EVENTS_CHANNEL]({} as never, {
                rangeEnd: '2026-04-25',
                rangeStart: '2026-04-24',
            }),
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
        const createIpcHandlers = await loadCreateIpcHandlers();
        const handlers = createIpcHandlers({
            settingsService: {
                getPreferences: vi.fn<() => Promise<AppPreferences>>(async () => {
                    throw createDayFlowError('INVALID_INPUT', 'Broken settings payload.');
                }),
                updatePreferences:
                    vi.fn<(input: UpdateAppPreferencesInput) => Promise<AppPreferences>>(),
            },
            googleCalendarService: {
                disconnectConnection: vi.fn<(connectionId: string) => Promise<void>>(),
                getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
                listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                listEvents: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
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
