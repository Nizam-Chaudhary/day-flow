// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { describe, expect, it, vi } from 'vitest';

import type { DayFlowApi } from '@/preload/create-day-flow-api';

import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';

const googleConnectionFixture = {
    calendars: [
        {
            accessRole: 'owner' as const,
            colorOverride: '#22c55e',
            connectionId: 'google:user-1',
            effectiveColor: '#22c55e',
            externalCalendarId: 'primary',
            googleBackgroundColor: '#1a73e8',
            googleForegroundColor: '#ffffff',
            id: 'google:user-1:primary',
            isPrimary: true,
            isSelected: true,
            lastSyncAt: '2026-04-18T00:00:00.000Z',
            lastSyncError: null,
            lastSyncStatus: 'success' as const,
            name: 'Primary',
            reminderChannel: 'in_app' as const,
            reminderEnabled: false,
            reminderLeadMinutes: 15 as const,
            syncEnabled: true,
            syncIntervalMinutes: 15 as const,
            type: 'default' as const,
        },
    ],
    credentialStorageMode: 'sqlite_plaintext' as const,
    displayName: 'Nizam Chaudhary',
    email: 'nizam@example.com',
    id: 'google:user-1',
    lastSyncAt: '2026-04-18T00:00:00.000Z',
    lastSyncError: null,
    lastSyncStatus: 'success' as const,
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    selectedCalendarCount: 1,
};

type DayFlowApiOverrides = {
    app?: Partial<DayFlowApi['app']>;
    googleCalendar?: Partial<DayFlowApi['googleCalendar']>;
    settings?: Partial<DayFlowApi['settings']>;
};

describe('GoogleCalendarIntegrationPage', () => {
    it('renders the empty state when no account is linked', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([]),
            },
        });

        renderApp('/integrations/google');

        expect(await screen.findByText('No linked Google accounts')).toBeTruthy();
    });

    it('renders accounts and warns when plaintext token fallback is active', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([googleConnectionFixture]),
            },
        });

        renderApp('/integrations/google');

        expect(await screen.findByText('Nizam Chaudhary')).toBeTruthy();
        expect(await screen.findByText('Unencrypted SQLite token storage')).toBeTruthy();
    });

    it('updates per-calendar controls through the preload API', async () => {
        const user = userEvent.setup();
        const updateCalendar = vi
            .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
            .mockResolvedValue(googleConnectionFixture);

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([googleConnectionFixture]),
                updateCalendar,
            },
        });

        renderApp('/integrations/google');

        await screen.findByText('Nizam Chaudhary');
        await user.click(screen.getByRole('button', { name: /Nizam Chaudhary/i }));
        expect(await screen.findAllByText('Primary')).toHaveLength(2);

        await user.click(screen.getByRole('switch', { name: 'Reminder enabled' }));

        await waitFor(() => {
            expect(updateCalendar).toHaveBeenCalledWith({
                calendarId: 'google:user-1:primary',
                reminderEnabled: true,
            });
        });

        fireEvent.change(screen.getByLabelText('Hex override'), {
            target: { value: '#0f172a' },
        });
        fireEvent.blur(screen.getByLabelText('Hex override'));

        await waitFor(() => {
            expect(updateCalendar).toHaveBeenCalledWith({
                calendarId: 'google:user-1:primary',
                colorOverride: '#0f172a',
            });
        });
    });
});

function createDayFlowApi(overrides: DayFlowApiOverrides = {}): DayFlowApi {
    return {
        app: {
            getHealth: vi.fn<DayFlowApi['app']['getHealth']>().mockResolvedValue({
                databasePath: '/tmp/day-flow.sqlite',
                databaseReady: true,
                lastMigrationAt: '2026-04-18T00:00:00.000Z',
            }),
            ...overrides.app,
        },
        googleCalendar: {
            disconnectConnection: vi
                .fn<DayFlowApi['googleCalendar']['disconnectConnection']>()
                .mockResolvedValue(undefined),
            getConnectionDetail: vi
                .fn<DayFlowApi['googleCalendar']['getConnectionDetail']>()
                .mockResolvedValue(googleConnectionFixture),
            listConnections: vi
                .fn<DayFlowApi['googleCalendar']['listConnections']>()
                .mockResolvedValue([googleConnectionFixture]),
            startConnection: vi
                .fn<DayFlowApi['googleCalendar']['startConnection']>()
                .mockResolvedValue({
                    authUrl: 'https://accounts.google.com',
                    connectionId: 'google:user-1',
                    email: 'nizam@example.com',
                    flowId: 'flow-1',
                }),
            syncConnection: vi
                .fn<DayFlowApi['googleCalendar']['syncConnection']>()
                .mockResolvedValue(googleConnectionFixture),
            updateCalendar: vi
                .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
                .mockResolvedValue(googleConnectionFixture),
            updateConnection: vi
                .fn<DayFlowApi['googleCalendar']['updateConnection']>()
                .mockResolvedValue(googleConnectionFixture),
            ...overrides.googleCalendar,
        },
        settings: {
            getPreferences: vi.fn<DayFlowApi['settings']['getPreferences']>().mockResolvedValue({
                createdAt: '2026-04-18T00:00:00.000Z',
                dayStartsAt: '08:00',
                defaultCalendarView: 'week',
                updatedAt: '2026-04-18T00:00:00.000Z',
                weekStartsOn: 1,
            }),
            updatePreferences: vi
                .fn<DayFlowApi['settings']['updatePreferences']>()
                .mockResolvedValue({
                    createdAt: '2026-04-18T00:00:00.000Z',
                    dayStartsAt: '08:00',
                    defaultCalendarView: 'week',
                    updatedAt: '2026-04-18T00:00:00.000Z',
                    weekStartsOn: 1,
                }),
            ...overrides.settings,
        },
    };
}

function renderApp(initialPath: string) {
    const history = createMemoryHistory({
        initialEntries: [initialPath],
    });
    const queryClient = createQueryClient();
    const router = createRouter({
        history,
        routeTree,
    });

    return render(
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster />
            </QueryClientProvider>
        </ThemeProvider>,
    );
}
