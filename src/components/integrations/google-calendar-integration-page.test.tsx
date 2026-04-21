// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DayFlowApi } from '@/preload/create-day-flow-api';
import type {
    GoogleCalendarSummary,
    GoogleConnectionDetail,
} from '@/schemas/contracts/google-calendar';

import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';

const baseCalendarFixture: GoogleCalendarSummary = {
    accessRole: 'owner' as const,
    calendarColorType: 'custom' as const,
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
};

const baseConnectionFixture: GoogleConnectionDetail = {
    calendars: [baseCalendarFixture],
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

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

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
        vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-21T00:00:00.000Z').getTime());

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([createGoogleConnectionFixture()]),
            },
        });

        renderApp('/integrations/google');

        expect(await screen.findAllByText('Nizam Chaudhary')).toHaveLength(1);
        expect(await screen.findAllByText('Google Calendar')).toHaveLength(2);
        expect(await screen.findAllByTestId('google-calendar-provider-avatar')).toHaveLength(1);
        expect(await screen.findByText('1 calendar')).toBeTruthy();
        expect(await screen.findByText('Synced 3 days ago')).toBeTruthy();
        expect(await screen.findAllByText('Unencrypted storage')).toHaveLength(1);
        expect(await screen.findByText('In-app reminders')).toBeTruthy();
        expect(screen.queryByText('4 OAuth scopes')).toBeNull();
        expect(
            screen.queryByText('openid, email, profile, https://www.googleapis.com/auth/calendar'),
        ).toBeNull();
        expect(
            screen.queryByText(
                'Secure credential storage is unavailable on this machine. Tokens are stored unencrypted in SQLite for this account.',
            ),
        ).toBeNull();
        expect(screen.queryByText('Reminder channel')).toBeNull();
        expect((await screen.findAllByRole('button', { name: 'Sync now' })).length).toBeGreaterThan(
            0,
        );
        expect(await screen.findByRole('button', { name: 'Disconnect account' })).toBeTruthy();
    });

    it('toggles a calendar account when the full row is clicked', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture(),
                        createGoogleConnectionFixture({
                            calendars: [
                                createGoogleCalendarFixture({
                                    connectionId: 'google:user-2',
                                    id: 'google:user-2:work',
                                    name: 'Work',
                                }),
                            ],
                            displayName: 'Secondary Account',
                            email: 'secondary@example.com',
                            id: 'google:user-2',
                            selectedCalendarCount: 1,
                        }),
                    ]),
            },
        });

        renderApp('/integrations/google');

        const user = userEvent.setup();
        const rowTrigger = await screen.findByLabelText('Toggle Secondary Account calendars');

        expect(rowTrigger.getAttribute('aria-expanded')).toBe('false');

        await user.click(rowTrigger);

        expect(rowTrigger.getAttribute('aria-expanded')).toBe('true');
        expect(await screen.findByText('Work')).toBeTruthy();

        await user.click(rowTrigger);

        expect(rowTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not toggle a collapsed account when sync or disconnect actions are clicked', async () => {
        const syncConnection = vi
            .fn<DayFlowApi['googleCalendar']['syncConnection']>()
            .mockResolvedValue(createGoogleConnectionFixture());
        const disconnectConnection = vi
            .fn<DayFlowApi['googleCalendar']['disconnectConnection']>()
            .mockResolvedValue(undefined);

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                disconnectConnection,
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture(),
                        createGoogleConnectionFixture({
                            calendars: [
                                createGoogleCalendarFixture({
                                    connectionId: 'google:user-2',
                                    id: 'google:user-2:work',
                                    name: 'Work',
                                }),
                            ],
                            displayName: 'Secondary Account',
                            email: 'secondary@example.com',
                            id: 'google:user-2',
                            selectedCalendarCount: 1,
                        }),
                    ]),
                syncConnection,
            },
        });

        renderApp('/integrations/google');

        const user = userEvent.setup();
        const rowTrigger = await screen.findByLabelText('Toggle Secondary Account calendars');
        const item = rowTrigger.closest('[data-slot="accordion-item"]');

        expect(item).toBeTruthy();
        expect(rowTrigger.getAttribute('aria-expanded')).toBe('false');

        await user.click(within(item as HTMLElement).getByRole('button', { name: 'Sync now' }));

        await waitFor(() => {
            expect(syncConnection).toHaveBeenCalledWith('google:user-2');
        });
        expect(rowTrigger.getAttribute('aria-expanded')).toBe('false');

        await user.click(
            within(item as HTMLElement).getByRole('button', { name: 'Disconnect account' }),
        );

        await waitFor(() => {
            expect(disconnectConnection).toHaveBeenCalledWith('google:user-2');
        });
        expect(rowTrigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('hides detail sections when the calendar is disabled', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture({
                            calendars: [
                                createGoogleCalendarFixture({
                                    calendarColorType: 'curated',
                                    colorOverride: null,
                                    effectiveColor: '#1a73e8',
                                    isSelected: false,
                                }),
                            ],
                            selectedCalendarCount: 0,
                        }),
                    ]),
            },
        });

        renderApp('/integrations/google');

        expect((await screen.findAllByText('Primary')).length).toBeGreaterThan(0);
        expect(screen.queryByText('Sync enabled')).toBeNull();
        expect(screen.queryByText('Default reminder time')).toBeNull();
        expect(screen.queryByText('Calendar color type')).toBeNull();
    });

    it('falls back to not synced when the last sync timestamp is invalid', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture({
                            lastSyncAt: 'not-a-date',
                        }),
                    ]),
            },
        });

        renderApp('/integrations/google');

        expect(await screen.findByText('Not synced')).toBeTruthy();
    });

    it('shows a sync error badge when the last sync failed and no timestamp is present', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture({
                            lastSyncAt: null,
                            lastSyncStatus: 'error',
                        }),
                    ]),
            },
        });

        renderApp('/integrations/google');

        expect(await screen.findByText('Sync error')).toBeTruthy();
    });

    it('disables dependent controls based on the parent toggles', async () => {
        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture({
                            calendars: [
                                createGoogleCalendarFixture({
                                    reminderEnabled: false,
                                    syncEnabled: false,
                                }),
                            ],
                        }),
                    ]),
            },
        });

        renderApp('/integrations/google');

        expect((await screen.findByLabelText('Sync interval')).matches(':disabled')).toBe(true);
        expect((await screen.findByLabelText('Default reminder time')).matches(':disabled')).toBe(
            true,
        );
    });

    it('autosaves reminder changes through the preload API after the debounce window', async () => {
        const updateCalendar = vi
            .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
            .mockResolvedValue(createGoogleConnectionFixture());

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([createGoogleConnectionFixture()]),
                updateCalendar,
            },
        });

        renderApp('/integrations/google');

        const user = userEvent.setup();

        expect((await screen.findAllByText('Primary')).length).toBeGreaterThan(0);
        await user.click(screen.getByRole('switch', { name: 'Reminder enabled' }));

        expect(updateCalendar).not.toHaveBeenCalled();

        await waitFor(
            () => {
                expect(updateCalendar).toHaveBeenCalledWith({
                    calendarId: 'google:user-1:primary',
                    reminderChannel: 'in_app',
                    reminderEnabled: true,
                });
            },
            { timeout: 1500 },
        );
    });

    it('debounces rapid custom color edits into a single save', async () => {
        const updateCalendar = vi
            .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
            .mockResolvedValue(createGoogleConnectionFixture());

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([createGoogleConnectionFixture()]),
                updateCalendar,
            },
        });

        renderApp('/integrations/google');

        const colorInput = (await screen.findByLabelText('Calendar color')) as HTMLInputElement;

        fireEvent.change(colorInput, { target: { value: '#123456' } });
        fireEvent.change(colorInput, { target: { value: '#234567' } });
        fireEvent.change(colorInput, { target: { value: '#345678' } });

        expect(updateCalendar).not.toHaveBeenCalled();

        await waitFor(
            () => {
                expect(updateCalendar).toHaveBeenCalledTimes(1);
                expect(updateCalendar).toHaveBeenCalledWith({
                    calendarId: 'google:user-1:primary',
                    colorOverride: '#345678',
                });
            },
            { timeout: 1500 },
        );
    });

    it('flushes custom color edits on blur without waiting for debounce', async () => {
        const updatedConnection = createGoogleConnectionFixture({
            calendars: [
                createGoogleCalendarFixture({
                    colorOverride: '#0f172a',
                    effectiveColor: '#0f172a',
                }),
            ],
        });
        const updateCalendar = vi
            .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
            .mockResolvedValue(updatedConnection);

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([createGoogleConnectionFixture()]),
                updateCalendar,
            },
        });

        renderApp('/integrations/google');

        const colorInput = (await screen.findByLabelText('Calendar color')) as HTMLInputElement;

        fireEvent.change(colorInput, {
            target: { value: '#0f172a' },
        });
        fireEvent.blur(colorInput);

        await waitFor(() => {
            expect(updateCalendar).toHaveBeenCalledWith({
                calendarId: 'google:user-1:primary',
                colorOverride: '#0f172a',
            });
        });
    });

    it('sends calendarColorType when the mode changes', async () => {
        const updateCalendar = vi
            .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
            .mockResolvedValue(
                createGoogleConnectionFixture({
                    calendars: [
                        createGoogleCalendarFixture({
                            calendarColorType: 'custom',
                            colorOverride: '#1a73e8',
                            effectiveColor: '#1a73e8',
                        }),
                    ],
                }),
            );

        window.dayFlowApi = createDayFlowApi({
            googleCalendar: {
                listConnections: vi
                    .fn<DayFlowApi['googleCalendar']['listConnections']>()
                    .mockResolvedValue([
                        createGoogleConnectionFixture({
                            calendars: [
                                createGoogleCalendarFixture({
                                    calendarColorType: 'curated',
                                    colorOverride: null,
                                    effectiveColor: '#1a73e8',
                                }),
                            ],
                        }),
                    ]),
                updateCalendar,
            },
        });

        renderApp('/integrations/google');

        const user = userEvent.setup();

        expect((await screen.findAllByText('Primary')).length).toBeGreaterThan(0);
        await user.click(screen.getByRole('button', { name: 'Custom' }));

        await waitFor(
            () => {
                expect(updateCalendar).toHaveBeenCalledWith({
                    calendarColorType: 'custom',
                    calendarId: 'google:user-1:primary',
                });
            },
            { timeout: 1500 },
        );
    });
});

function createGoogleCalendarFixture(overrides: Partial<GoogleCalendarSummary> = {}) {
    return {
        ...baseCalendarFixture,
        ...overrides,
    };
}

function createGoogleConnectionFixture(overrides: Partial<GoogleConnectionDetail> = {}) {
    return {
        ...baseConnectionFixture,
        ...overrides,
    };
}

function createDayFlowApi(overrides: DayFlowApiOverrides = {}): DayFlowApi {
    const defaultConnection = createGoogleConnectionFixture();

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
                .mockResolvedValue(defaultConnection),
            listConnections: vi
                .fn<DayFlowApi['googleCalendar']['listConnections']>()
                .mockResolvedValue([defaultConnection]),
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
                .mockResolvedValue(defaultConnection),
            updateCalendar: vi
                .fn<DayFlowApi['googleCalendar']['updateCalendar']>()
                .mockResolvedValue(defaultConnection),
            updateConnection: vi
                .fn<DayFlowApi['googleCalendar']['updateConnection']>()
                .mockResolvedValue(defaultConnection),
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
