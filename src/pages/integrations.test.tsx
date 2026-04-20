// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { describe, expect, it, vi } from 'vitest';

import type { DayFlowApi } from '@/preload/create-day-flow-api';

import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';

describe('Integrations page', () => {
    it('renders grouped integration sections, shows live Google counts, and opens Google configuration', async () => {
        const user = userEvent.setup();

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        {
                            ...googleConnectionFixture,
                            id: 'google:user-1',
                        },
                    ]),
            },
        });

        renderApp('/integrations');

        expect(await screen.findByRole('heading', { name: 'Integrations' })).toBeTruthy();

        const headings = screen.getAllByRole('heading', { level: 3 });

        expect(headings.map((heading) => heading.textContent)).toEqual([
            'Calendar',
            'Sync',
            'Notifications & Other',
        ]);

        const calendarSection = headings[0].closest('section');
        const syncSection = headings[1].closest('section');
        const notificationsSection = headings[2].closest('section');

        expect(within(calendarSection as HTMLElement).getByText('Google Calendar')).toBeTruthy();
        expect(within(calendarSection as HTMLElement).getByText('Apple Calendar')).toBeTruthy();
        expect(within(calendarSection as HTMLElement).getByText('Outlook')).toBeTruthy();
        expect(
            await within(calendarSection as HTMLElement).findByText('1 account linked'),
        ).toBeTruthy();
        expect(
            within(calendarSection as HTMLElement).getAllByText('0 accounts linked'),
        ).toHaveLength(2);

        expect(within(syncSection as HTMLElement).getByText('Notion')).toBeTruthy();
        expect(
            within(syncSection as HTMLElement).getByText('Connected: No · Configured: No'),
        ).toBeTruthy();

        expect(within(notificationsSection as HTMLElement).getByText('Slack')).toBeTruthy();

        expect(screen.queryByText('Notion mapping preview')).toBeNull();
        expect(screen.queryByRole('table')).toBeNull();

        const configureButtons = screen.getAllByRole('button', { name: 'Coming soon' });

        expect(configureButtons).toHaveLength(4);

        for (const button of configureButtons) {
            expect(button).toHaveProperty('disabled', true);
        }

        expect(within(calendarSection as HTMLElement).getAllByText('Coming soon')).toHaveLength(2);
        expect(within(syncSection as HTMLElement).getAllByText('Coming soon')).toHaveLength(1);
        expect(
            within(notificationsSection as HTMLElement).getAllByText('Coming soon'),
        ).toHaveLength(1);

        await user.click(screen.getByRole('button', { name: 'Configure' }));

        expect(await screen.findByRole('heading', { name: 'Google Calendar' })).toBeTruthy();
        expect(screen.getByText('Connection summary')).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Integrations' })).toBeNull();
    });
});

const googleConnectionFixture = {
    calendars: [],
    credentialStorageMode: 'sqlite_plaintext' as const,
    displayName: 'Nizam Chaudhary',
    email: 'nizam@example.com',
    id: 'google:user-1',
    lastSyncAt: '2026-04-18T00:00:00.000Z',
    lastSyncError: null,
    lastSyncStatus: 'success' as const,
    scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    selectedCalendarCount: 0,
};

type DayFlowApiOverrides = {
    app?: Partial<DayFlowApi['app']>;
    googleCalendar?: Partial<DayFlowApi['googleCalendar']>;
    settings?: Partial<DayFlowApi['settings']>;
};

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
