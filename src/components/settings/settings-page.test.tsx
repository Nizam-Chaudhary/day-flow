// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppHealth } from '@/schemas/contracts/health';
import type { AppPreferences, UpdateAppPreferencesInput } from '@/schemas/contracts/settings';

const { toastPromise } = vi.hoisted(() => ({
    toastPromise: vi.fn<(promise: Promise<unknown>) => Promise<unknown>>((promise) => promise),
}));

vi.mock('sonner', () => ({
    toast: {
        promise: toastPromise,
    },
}));

import type { DayFlowApi } from '@/preload/create-day-flow-api';

import { SettingsPage } from '@/components/settings/settings-page';
import { createQueryClient } from '@/lib/query/create-query-client';
import { resetAppShellStore } from '@/stores/app-shell-store';

describe('SettingsPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        resetAppShellStore();
        toastPromise.mockClear();
    });

    it('loads preferences, submits updates with toast feedback, and invalidates the settings query', async () => {
        const getHealth = vi.fn<() => Promise<AppHealth>>().mockResolvedValue({
            databasePath: '/tmp/day-flow.sqlite',
            databaseReady: true,
            lastMigrationAt: '2026-04-18T00:00:00.000Z',
        });
        const getPreferences = vi.fn<() => Promise<AppPreferences>>(async () => ({
            createdAt: '2026-04-18T00:00:00.000Z',
            dayStartsAt: '07:45',
            defaultCalendarView: 'day',
            updatedAt: '2026-04-18T00:15:00.000Z',
            weekStartsOn: 1,
        }));

        getPreferences.mockResolvedValueOnce({
            createdAt: '2026-04-18T00:00:00.000Z',
            dayStartsAt: '09:30',
            defaultCalendarView: 'month',
            updatedAt: '2026-04-18T00:00:00.000Z',
            weekStartsOn: 0,
        });

        let resolveUpdate!: (value: AppPreferences) => void;
        const updatePreferences = vi
            .fn<(input: UpdateAppPreferencesInput) => Promise<AppPreferences>>()
            .mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveUpdate = resolve;
                    }),
            );

        window.dayFlowApi = {
            app: { getHealth },
            googleCalendar: {
                disconnectConnection: vi.fn<(connectionId: string) => Promise<void>>(),
                getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
                listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                listEvents: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                startConnection: vi.fn<() => Promise<never>>(),
                syncConnection: vi.fn<(connectionId: string) => Promise<never>>(),
                updateCalendar: vi.fn<(input: never) => Promise<never>>(),
                updateConnection: vi.fn<(input: never) => Promise<never>>(),
            },
            settings: {
                getPreferences,
                updatePreferences,
            },
        } satisfies DayFlowApi;

        renderWithProviders(<SettingsPage />);

        const timeInput = (await screen.findByLabelText('Day starts at')) as HTMLInputElement;

        await waitFor(() => {
            expect(timeInput.value).toBe('09:30');
        });

        fireEvent.change(timeInput, { target: { value: '07:45' } });
        await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

        await waitFor(() => {
            expect(updatePreferences).toHaveBeenCalledWith({
                dayStartsAt: '07:45',
                defaultCalendarView: 'month',
                weekStartsOn: 0,
            });
        });

        await waitFor(() => {
            expect(toastPromise).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save preferences' })).toHaveProperty(
                'disabled',
                true,
            );
        });

        resolveUpdate({
            createdAt: '2026-04-18T00:00:00.000Z',
            dayStartsAt: '07:45',
            defaultCalendarView: 'day',
            updatedAt: '2026-04-18T00:15:00.000Z',
            weekStartsOn: 1,
        });

        await waitFor(() => {
            expect(getPreferences).toHaveBeenCalledTimes(2);
        });

        expect((screen.getByLabelText('Day starts at') as HTMLInputElement).value).toBe('07:45');
    });

    it('renders query errors', async () => {
        window.dayFlowApi = {
            app: {
                getHealth: vi.fn<() => Promise<AppHealth>>().mockResolvedValue({
                    databasePath: '/tmp/day-flow.sqlite',
                    databaseReady: true,
                }),
            },
            googleCalendar: {
                disconnectConnection: vi.fn<(connectionId: string) => Promise<void>>(),
                getConnectionDetail: vi.fn<(connectionId: string) => Promise<never>>(),
                listConnections: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                listEvents: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
                startConnection: vi.fn<() => Promise<never>>(),
                syncConnection: vi.fn<(connectionId: string) => Promise<never>>(),
                updateCalendar: vi.fn<(input: never) => Promise<never>>(),
                updateConnection: vi.fn<(input: never) => Promise<never>>(),
            },
            settings: {
                getPreferences: vi
                    .fn<() => Promise<AppPreferences>>()
                    .mockRejectedValue(new Error('Database unavailable.')),
                updatePreferences:
                    vi.fn<(input: UpdateAppPreferencesInput) => Promise<AppPreferences>>(),
            },
        } satisfies DayFlowApi;

        renderWithProviders(<SettingsPage />);

        expect((await screen.findByText('Database unavailable.')).textContent).toContain(
            'Database unavailable.',
        );
    });
});

function renderWithProviders(component: ReactNode) {
    const queryClient = createQueryClient();

    return render(
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
        </ThemeProvider>,
    );
}
