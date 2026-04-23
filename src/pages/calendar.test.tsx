// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DayFlowApi } from '@/preload/create-day-flow-api';
import type { GoogleCalendarEvent } from '@/schemas/contracts/google-calendar';

import { rangeIncludesDate } from '@/components/calendar/calendar-events';
import { createQueryClient } from '@/lib/query/create-query-client';
import { CalendarPage } from '@/pages/calendar';
import { resetAppShellStore, useAppShellStore } from '@/stores/app-shell-store';

describe('CalendarPage', () => {
    beforeEach(() => {
        const todayIsoDate = format(new Date(), 'yyyy-MM-dd');
        resetAppShellStore();
        useAppShellStore.setState({
            activeCalendarView: 'week',
            selectedDate: todayIsoDate,
        });
        const todayEvents: GoogleCalendarEvent[] = [
            {
                calendarColor: '#1a73e8',
                calendarId: 'google:user-1:primary',
                calendarName: 'Primary',
                connectionId: 'google:user-1',
                description: 'Daily team sync',
                endAt: `${todayIsoDate}T09:30:00.000Z`,
                htmlLink: null,
                id: 'event-1',
                isAllDay: false,
                location: 'Room A',
                provider: 'google',
                startAt: `${todayIsoDate}T09:00:00.000Z`,
                status: 'confirmed',
                title: 'Standup',
            },
            {
                calendarColor: '#7cb342',
                calendarId: 'google:user-1:primary',
                calendarName: 'Primary',
                connectionId: 'google:user-1',
                description: null,
                endAt: format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                htmlLink: null,
                id: 'event-2',
                isAllDay: true,
                location: null,
                provider: 'google',
                startAt: todayIsoDate,
                status: 'confirmed',
                title: 'Company offsite',
            },
        ];
        window.dayFlowApi = {
            app: {
                getHealth: vi.fn<DayFlowApi['app']['getHealth']>(),
            },
            googleCalendar: {
                disconnectConnection: vi.fn<DayFlowApi['googleCalendar']['disconnectConnection']>(),
                getConnectionDetail: vi.fn<DayFlowApi['googleCalendar']['getConnectionDetail']>(),
                listConnections: vi.fn<DayFlowApi['googleCalendar']['listConnections']>(),
                listEvents: vi
                    .fn<DayFlowApi['googleCalendar']['listEvents']>()
                    .mockImplementation(async (input) =>
                        rangeIncludesDate(input, todayIsoDate) ? todayEvents : [],
                    ),
                startConnection: vi.fn<DayFlowApi['googleCalendar']['startConnection']>(),
                syncConnection: vi.fn<DayFlowApi['googleCalendar']['syncConnection']>(),
                updateCalendar: vi.fn<DayFlowApi['googleCalendar']['updateCalendar']>(),
                updateConnection: vi.fn<DayFlowApi['googleCalendar']['updateConnection']>(),
            },
            settings: {
                getPreferences: vi.fn<DayFlowApi['settings']['getPreferences']>(),
                updatePreferences: vi.fn<DayFlowApi['settings']['updatePreferences']>(),
            },
        } satisfies DayFlowApi;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders timed events in the planner and opens today sheet from the header button', async () => {
        const user = userEvent.setup();

        render(
            <QueryClientProvider client={createQueryClient()}>
                <CalendarPage />
            </QueryClientProvider>,
        );

        expect(await screen.findByRole('button', { name: 'Open event Standup' })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Today events \(2\)/ })).toBeTruthy();

        await user.click(screen.getByRole('button', { name: /Today events \(2\)/ }));

        expect(await screen.findByText("Today's events")).toBeTruthy();
        expect(screen.getByText('Company offsite')).toBeTruthy();
        expect(screen.getByText('All day')).toBeTruthy();
    });
});
