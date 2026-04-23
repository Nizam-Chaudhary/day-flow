// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { ThemeProvider } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DayFlowApi } from '@/preload/create-day-flow-api';
import type { AppHealth } from '@/schemas/contracts/health';
import type { AppPreferences, UpdateAppPreferencesInput } from '@/schemas/contracts/settings';

import { mockEvents } from '@/components/app-shell/mock-data';
import {
    mapMockEventToGoogleCalendarEvent,
    rangeIncludesDate,
} from '@/components/calendar/calendar-events';
import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';
import { resetAppShellStore } from '@/stores/app-shell-store';
import { buildDayRange, formatPlannerRangeLabel, getIsoDate } from '@/utils/planner-utils';

describe('App shell routes', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        resetAppShellStore();
        setViewportWidth(1280);
        mockMatchMedia();
        window.dayFlowApi = createDayFlowApi();
    });

    afterEach(() => {
        vi.useRealTimers();
        setViewportWidth(1280);
    });

    it.each([
        ['/', 'Today'],
        ['/calendar', 'Calendar'],
        ['/tasks', 'Tasks'],
        ['/reminders', 'Reminders'],
        ['/notes', 'Notes'],
        ['/integrations', 'Integrations'],
        ['/settings', 'Settings'],
    ])('renders %s inside the app shell', async (path, heading) => {
        renderApp(path);

        expect(await screen.findByRole('heading', { name: heading })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Open global search' })).toBeTruthy();
    });

    it.each([
        ['/calendar', 'Calendar', 'Unified scheduling workspace'],
        ['/tasks', 'Tasks', 'Execution lane'],
        ['/reminders', 'Reminders', 'Follow-up lane'],
        ['/notes', 'Notes', 'Bridge, not editor'],
        ['/integrations', 'Integrations', 'Connections and mappings'],
        ['/settings', 'Settings', 'Preferences and diagnostics'],
    ])('removes the eyebrow label from %s', async (path, heading, removedLabel) => {
        renderApp(path);
        await screen.findByRole('heading', { name: heading });

        expect(screen.queryByText(removedLabel)).toBeNull();
    });

    it('opens and closes the global search dialog', async () => {
        const user = setupUser();

        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        await user.click(await screen.findByRole('button', { name: 'Open global search' }));

        expect(
            await screen.findByPlaceholderText('Search routes, actions, or areas...'),
        ).toBeTruthy();

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByPlaceholderText('Search routes, actions, or areas...')).toBeNull();
        });
    });

    it('opens and submits the quick-add dialog', async () => {
        const user = setupUser();

        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        await user.click(await screen.findByRole('button', { name: 'Open quick add' }));
        expect(await screen.findByRole('heading', { name: 'Quick add' })).toBeTruthy();

        await user.type(screen.getByLabelText('Title'), 'Capture route scaffolding');
        await user.click(screen.getByRole('button', { name: 'Save quick add' }));

        await waitFor(
            () => {
                expect(screen.queryByRole('heading', { name: 'Quick add' })).toBeNull();
            },
            { timeout: 2500 },
        );
    });

    it('navigates between sidebar items', async () => {
        const user = setupUser();

        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        await user.click(await screen.findByRole('link', { name: 'Calendar' }));

        expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeTruthy();
    });

    it('renders coming-soon sidebar items as disabled controls', async () => {
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        const primaryNav = screen.getByRole('navigation', { name: 'Primary' });

        expect(within(primaryNav).queryByRole('link', { name: 'Today' })).toBeNull();
        expect(within(primaryNav).queryByRole('link', { name: 'Tasks' })).toBeNull();
        expect(within(primaryNav).queryByRole('link', { name: 'Reminders' })).toBeNull();
        expect(within(primaryNav).queryByRole('link', { name: 'Notes' })).toBeNull();

        expect(
            within(primaryNav).getByRole('button', { name: 'Today' }).getAttribute('aria-disabled'),
        ).toBe('true');
        expect(
            within(primaryNav).getByRole('button', { name: 'Tasks' }).getAttribute('aria-disabled'),
        ).toBe('true');
        expect(
            within(primaryNav)
                .getByRole('button', { name: 'Reminders' })
                .getAttribute('aria-disabled'),
        ).toBe('true');
        expect(
            within(primaryNav).getByRole('button', { name: 'Notes' }).getAttribute('aria-disabled'),
        ).toBe('true');
        expect(within(primaryNav).getAllByText('Coming soon')).toHaveLength(4);
        expect(within(primaryNav).getByRole('link', { name: 'Integrations' })).toBeTruthy();
    });

    it('renders the sidebar brand as a non-clickable item', async () => {
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        expect(screen.getByText('Day Flow')).toBeTruthy();
        expect(screen.getByRole('img', { name: 'Day Flow sidebar logo' })).toBeTruthy();
        expect(screen.queryByRole('link', { name: 'Day Flow' })).toBeNull();
    });

    it('renders header actions without a top bar logo', async () => {
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        const banner = screen.getByRole('banner');

        expect(within(banner).getByRole('button', { name: 'Toggle sidebar' })).toBeTruthy();
        expect(within(banner).getByRole('button', { name: 'Open global search' })).toBeTruthy();
        expect(within(banner).getByRole('button', { name: 'Sync now' })).toBeTruthy();
        expect(within(banner).queryByRole('img', { name: 'Day Flow' })).toBeNull();
        expect(within(banner).queryByText(/Updated /i)).toBeNull();
        expect(within(banner).queryByText('Not synced yet')).toBeNull();
        expect(within(banner).queryByText('Steady')).toBeNull();
        expect(within(banner).queryByText('In progress')).toBeNull();
    });

    it('opens the event detail sheet from the calendar page', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });
        expect(await screen.findByTestId('planner-surface')).toBeTruthy();

        await user.click(await screen.findByRole('button', { name: 'Open event Launch standup' }));

        expect(await screen.findByRole('heading', { name: 'Launch standup' })).toBeTruthy();
    });

    it('navigates the planner by one visible page', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();

        await user.click(await screen.findByRole('button', { name: 'Next dates' }));

        expect(await screen.findByText(getPlannerRangeLabel(5, 5))).toBeTruthy();
    });

    it('renders the shared planner in day view', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await user.click(await screen.findByRole('button', { name: 'Day' }));

        expect(await screen.findByTestId('planner-surface')).toBeTruthy();
        expect(await screen.findByText(getPlannerRangeLabel(0, 2))).toBeTruthy();
        expect(screen.getByRole('button', { name: getTodayButtonLabel() })).toBeTruthy();
    });

    it('keeps the active calendar view selected when clicked again', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        const weekButton = await screen.findByRole('button', { name: 'Week' });

        expect(weekButton.getAttribute('aria-pressed')).toBe('true');

        await user.click(weekButton);

        expect(weekButton.getAttribute('aria-pressed')).toBe('true');
        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
    });

    it('renders agenda as a disabled calendar view', async () => {
        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        const agendaButton = await screen.findByRole('button', { name: 'Agenda' });

        expect(agendaButton).toHaveProperty('disabled', true);
        expect(screen.getByRole('button', { name: 'Week' }).getAttribute('aria-pressed')).toBe(
            'true',
        );
        expect(screen.queryByText('Planner surface')).toBeNull();
    });

    it('hydrates the active calendar view toggle from preferences on load', async () => {
        window.dayFlowApi = createDayFlowApi({
            defaultCalendarView: 'month',
        });

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Month' }).getAttribute('aria-pressed')).toBe(
                'true',
            );
        });

        expect(screen.getByRole('button', { name: 'Week' }).getAttribute('aria-pressed')).toBe(
            'false',
        );
        expect(screen.queryByTestId('planner-surface')).toBeNull();
        expect(await screen.findByTestId('month-planner-surface')).toBeTruthy();
        expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeTruthy();
    });

    it('keeps the current day as the first visible date when switching back to week view', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await user.click(await screen.findByRole('button', { name: 'Day' }));
        await user.click(await screen.findByRole('button', { name: 'Week' }));

        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
    });

    it('resets the planner to today when clicking the today button', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await user.click(await screen.findByRole('button', { name: 'Next dates' }));
        expect(await screen.findByText(getPlannerRangeLabel(5, 5))).toBeTruthy();

        await user.click(await screen.findByRole('button', { name: getTodayButtonLabel() }));
        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
    });

    it('keeps the calendar planner inside shrinkable page containers', async () => {
        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        const plannerSurface = await screen.findByTestId('planner-surface');
        const calendarSection = plannerSurface.closest('section');

        expect(plannerSurface.className).toContain('min-w-0');
        expect(calendarSection?.className).toContain('min-w-0');
    });

    it('uses wrap-safe calendar controls while the desktop sidebar is expanded', async () => {
        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        const sidebarWrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
        const sidebarInset = document.querySelector('[data-slot="sidebar-inset"]');
        const sidebar = document.querySelector('[data-slot="sidebar"][data-state="expanded"]');
        const plannerSurface = await screen.findByTestId('planner-surface');
        const calendarSection = plannerSurface.closest('section');
        const controls = await screen.findByTestId('calendar-page-controls');
        const viewToggle = await screen.findByTestId('calendar-view-toggle');
        const addEventButton = screen.getByRole('button', { name: 'Add event' });
        const shellColumn = plannerSurface.closest('[class*="overflow-x-clip"]') as HTMLElement;

        expect(sidebar).toBeTruthy();
        expect(sidebarWrapper?.className).toContain('overflow-x-clip');
        expect(sidebarInset?.className).toContain('overflow-x-clip');
        expect(sidebarInset?.className).toContain('max-w-full');
        expect(calendarSection?.className).toContain('min-w-0');
        expect(calendarSection?.className).toContain('max-w-full');
        expect(controls.className).toContain('w-full');
        expect(controls.className).toContain('sm:w-auto');
        expect(viewToggle.className).toContain('w-full');
        expect(viewToggle.className).toContain('flex-wrap');
        expect(addEventButton.className).toContain('w-full');
        expect(addEventButton.className).toContain('sm:w-auto');
        expect(plannerSurface.className).toContain('min-w-0');
        expect(shellColumn?.className).toContain('overflow-x-clip');
    });

    it('opens the task detail sheet from the tasks page', async () => {
        const user = setupUser();

        renderApp('/tasks');
        await screen.findByRole('heading', { name: 'Tasks' });

        await user.click(
            await screen.findByRole('button', { name: 'Open task Prepare blocker digest' }),
        );

        expect(await screen.findByRole('heading', { name: 'Prepare blocker digest' })).toBeTruthy();
    });

    it('toggles the desktop sidebar from the header', async () => {
        const user = setupUser();

        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        const sidebar = document.querySelector('[data-slot="sidebar"][data-state="expanded"]');

        expect(sidebar).toBeTruthy();
        expect(sidebar?.getAttribute('data-state')).toBe('expanded');

        await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }));

        await waitFor(() => {
            expect(sidebar?.getAttribute('data-state')).toBe('collapsed');
            expect(sidebar?.getAttribute('data-collapsible')).toBe('icon');
        });

        expect(screen.getByRole('img', { name: 'Day Flow sidebar logo' })).toBeTruthy();
    });

    it('keeps settings only in the footer navigation', async () => {
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        const primaryNav = screen.getByRole('navigation', { name: 'Primary' });
        const preferencesNav = screen.getByRole('navigation', { name: 'Preferences' });

        expect(within(primaryNav).queryByRole('link', { name: 'Settings' })).toBeNull();
        expect(within(preferencesNav).getByRole('link', { name: 'Settings' })).toBeTruthy();
        expect(screen.queryByRole('link', { name: /Task execution lane/i })).toBeNull();
    });

    it('keeps settings searchable in the command palette', async () => {
        const user = setupUser();

        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        await user.click(screen.getByRole('button', { name: 'Open global search' }));

        const dialog = await screen.findByRole('dialog');

        expect(within(dialog).getByText('Settings')).toBeTruthy();
        expect(within(dialog).getByText('Preferences and diagnostics')).toBeTruthy();
    });

    it('opens the mobile sidebar from the header toggle', async () => {
        const user = setupUser();

        setViewportWidth(767);
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        expect(
            within(screen.getByRole('banner')).getByRole('button', { name: 'Toggle sidebar' }),
        ).toBeTruthy();
        expect(
            within(screen.getByRole('banner')).queryByRole('img', { name: 'Day Flow' }),
        ).toBeNull();

        await user.click(await screen.findByRole('button', { name: 'Toggle sidebar' }));

        const dialog = await screen.findByRole('dialog');

        expect(
            within(dialog).getByRole('button', { name: 'Tasks' }).getAttribute('aria-disabled'),
        ).toBe('true');
        expect(within(dialog).getByRole('link', { name: 'Integrations' })).toBeTruthy();
    });

    it('closes the mobile sidebar after selecting an enabled nav item', async () => {
        const user = setupUser();

        setViewportWidth(767);
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        await user.click(await screen.findByRole('button', { name: 'Toggle sidebar' }));

        const dialog = await screen.findByRole('dialog');

        await user.click(within(dialog).getByRole('link', { name: 'Integrations' }));

        expect(await screen.findByRole('heading', { name: 'Integrations' })).toBeTruthy();

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });
});

function mockMatchMedia() {
    const createMediaQueryList = (query: string): MediaQueryList => ({
        matches: query === '(max-width: 767px)' ? window.innerWidth < 768 : false,
        media: query,
        onchange: null,
        addEventListener:
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject | null,
                    options?: boolean | AddEventListenerOptions,
                ) => void
            >(),
        removeEventListener:
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject | null,
                    options?: boolean | EventListenerOptions,
                ) => void
            >(),
        addListener:
            vi.fn<
                (listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) => void
            >(),
        removeListener:
            vi.fn<
                (listener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null) => void
            >(),
        dispatchEvent: vi.fn<(event: Event) => boolean>().mockReturnValue(true),
    });

    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: vi
            .fn<(query: string) => MediaQueryList>()
            .mockImplementation((query: string) => createMediaQueryList(query)),
    });
}

function setViewportWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: width,
    });
}

function setupUser() {
    return userEvent.setup();
}

function getPlannerRangeLabel(startOffset: number, visibleDays: number) {
    return formatPlannerRangeLabel(
        buildDayRange(getIsoDate(addDays(new Date(), startOffset)), visibleDays),
    );
}

function getTodayButtonLabel() {
    return `Today ${format(new Date(), 'd MMM, yyyy')}`;
}

function createDayFlowApi(preferenceOverrides: Partial<AppPreferences> = {}): DayFlowApi {
    const preferences: AppPreferences = {
        createdAt: '2026-04-18T00:00:00.000Z',
        dayStartsAt: '08:00',
        defaultCalendarView: 'week',
        updatedAt: '2026-04-18T00:15:00.000Z',
        weekStartsOn: 1,
        ...preferenceOverrides,
    };

    return {
        app: {
            getHealth: vi.fn<() => Promise<AppHealth>>().mockResolvedValue({
                databasePath: '/tmp/day-flow.sqlite',
                databaseReady: true,
                lastMigrationAt: '2026-04-18T00:00:00.000Z',
            }),
        },
        googleCalendar: {
            disconnectConnection: vi
                .fn<(connectionId: string) => Promise<void>>()
                .mockResolvedValue(undefined),
            getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
            listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
            listEvents: vi
                .fn<DayFlowApi['googleCalendar']['listEvents']>()
                .mockImplementation(async (input) =>
                    mockEvents
                        .filter((event) => rangeIncludesDate(input, event.date))
                        .map(mapMockEventToGoogleCalendarEvent),
                ),
            startConnection: vi.fn<() => Promise<never>>(),
            syncConnection: vi.fn<(connectionId: string) => Promise<never>>(),
            updateCalendar: vi.fn<(input: never) => Promise<never>>(),
            updateConnection: vi.fn<(input: never) => Promise<never>>(),
        },
        settings: {
            getPreferences: vi.fn<() => Promise<AppPreferences>>().mockResolvedValue(preferences),
            updatePreferences: vi
                .fn<(input: UpdateAppPreferencesInput) => Promise<AppPreferences>>()
                .mockResolvedValue(preferences),
        },
    } satisfies DayFlowApi;
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
