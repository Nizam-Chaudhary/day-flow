// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { ThemeProvider } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DayFlowApi } from '@/preload/create-day-flow-api';
import type { AppHealth } from '@/shared/contracts/health';
import type { AppPreferences, UpdateAppPreferencesInput } from '@/shared/contracts/settings';

import { Toaster } from '@/components/ui/sonner';
import {
    buildDayRange,
    formatPlannerRangeLabel,
    getIsoDate,
} from '@/features/calendar/planner-utils';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';
import { resetAppShellStore } from '@/stores/app-shell-store';

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

        await user.click(await screen.findByRole('link', { name: /Calendar/i }));

        expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeTruthy();
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

        expect(await screen.findByText(getPlannerRangeLabel(0))).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Next dates' }));

        expect(await screen.findByText(getPlannerRangeLabel(4))).toBeTruthy();
    });

    it('renders the shared planner in day view', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await user.click(screen.getByRole('button', { name: 'Day' }));

        expect(await screen.findByTestId('planner-surface')).toBeTruthy();
        expect(await screen.findByText(getPlannerRangeLabel(0))).toBeTruthy();
        expect(screen.getByRole('button', { name: getTodayButtonLabel() })).toBeTruthy();
    });

    it('keeps the current day as the first visible date when switching back to week view', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await user.click(screen.getByRole('button', { name: 'Day' }));
        await user.click(screen.getByRole('button', { name: 'Week' }));

        expect(await screen.findByText(getPlannerRangeLabel(0))).toBeTruthy();
    });

    it('resets the planner to today when clicking the today button', async () => {
        const user = setupUser();

        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        await user.click(screen.getByRole('button', { name: 'Next dates' }));
        expect(await screen.findByText(getPlannerRangeLabel(4))).toBeTruthy();

        await user.click(screen.getByRole('button', { name: getTodayButtonLabel() }));
        expect(await screen.findByText(getPlannerRangeLabel(0))).toBeTruthy();
    });

    it('keeps the calendar planner inside shrinkable page containers', async () => {
        renderApp('/calendar');
        await screen.findByRole('heading', { name: 'Calendar' });

        const plannerSurface = await screen.findByTestId('planner-surface');
        const calendarSection = plannerSurface.closest('section');

        expect(plannerSurface.className).toContain('min-w-0');
        expect(calendarSection?.className).toContain('min-w-0');
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

        expect(within(dialog).getByRole('link', { name: 'Tasks' })).toBeTruthy();
    });

    it('closes the mobile sidebar after selecting a nav item', async () => {
        const user = setupUser();

        setViewportWidth(767);
        renderApp('/');
        await screen.findByRole('heading', { name: 'Today' });

        await user.click(await screen.findByRole('button', { name: 'Toggle sidebar' }));

        const dialog = await screen.findByRole('dialog');

        await user.click(within(dialog).getByRole('link', { name: 'Tasks' }));

        expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeTruthy();

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

function getPlannerRangeLabel(startOffset: number, visibleDays = 4) {
    return formatPlannerRangeLabel(
        buildDayRange(getIsoDate(addDays(new Date(), startOffset)), visibleDays),
    );
}

function getTodayButtonLabel() {
    return `Today ${format(new Date(), 'd MMM, yyyy')}`;
}

function createDayFlowApi(): DayFlowApi {
    return {
        app: {
            getHealth: vi.fn<() => Promise<AppHealth>>().mockResolvedValue({
                databasePath: '/tmp/day-flow.sqlite',
                databaseReady: true,
                lastMigrationAt: '2026-04-18T00:00:00.000Z',
            }),
        },
        settings: {
            getPreferences: vi.fn<() => Promise<AppPreferences>>().mockResolvedValue({
                createdAt: '2026-04-18T00:00:00.000Z',
                dayStartsAt: '08:00',
                defaultCalendarView: 'week',
                updatedAt: '2026-04-18T00:15:00.000Z',
                weekStartsOn: 1,
            }),
            updatePreferences: vi
                .fn<(input: UpdateAppPreferencesInput) => Promise<AppPreferences>>()
                .mockResolvedValue({
                    createdAt: '2026-04-18T00:00:00.000Z',
                    dayStartsAt: '08:00',
                    defaultCalendarView: 'week',
                    updatedAt: '2026-04-18T00:15:00.000Z',
                    weekStartsOn: 1,
                }),
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
