import { format, parseISO, subDays } from 'date-fns';

import type { MockEvent } from '@/components/app-shell/mock-data';
import type {
    GoogleCalendarEvent,
    GoogleCalendarListEventsInput,
} from '@/schemas/contracts/google-calendar';

export interface CalendarUiEvent {
    calendarColor: string;
    calendarId: string;
    calendarName: string;
    connectionId: string;
    date: string;
    description: string | null;
    endAt: string;
    endTime: string;
    htmlLink: string | null;
    id: string;
    isAllDay: boolean;
    location: string | null;
    provider: 'google';
    startAt: string;
    startTime: string;
    status: string;
    title: string;
}

export interface CalendarUiEventSplit {
    allDayEvents: CalendarUiEvent[];
    timedEvents: CalendarUiEvent[];
}

export function mapGoogleCalendarEventToCalendarUiEvent(
    event: GoogleCalendarEvent,
): CalendarUiEvent {
    if (event.isAllDay) {
        return {
            calendarColor: event.calendarColor,
            calendarId: event.calendarId,
            calendarName: event.calendarName,
            connectionId: event.connectionId,
            date: event.startAt,
            description: event.description,
            endAt: event.endAt,
            endTime: '23:59',
            htmlLink: event.htmlLink,
            id: event.id,
            isAllDay: true,
            location: event.location,
            provider: event.provider,
            startAt: event.startAt,
            startTime: '00:00',
            status: event.status,
            title: event.title,
        };
    }

    const startDate = parseISO(event.startAt);
    const endDate = parseISO(event.endAt);

    return {
        calendarColor: event.calendarColor,
        calendarId: event.calendarId,
        calendarName: event.calendarName,
        connectionId: event.connectionId,
        date: format(startDate, 'yyyy-MM-dd'),
        description: event.description,
        endAt: event.endAt,
        endTime: format(endDate, 'HH:mm'),
        htmlLink: event.htmlLink,
        id: event.id,
        isAllDay: false,
        location: event.location,
        provider: event.provider,
        startAt: event.startAt,
        startTime: format(startDate, 'HH:mm'),
        status: event.status,
        title: event.title,
    };
}

export function splitCalendarUiEvents(events: CalendarUiEvent[]): CalendarUiEventSplit {
    return events.reduce<CalendarUiEventSplit>(
        (result, event) => {
            if (event.isAllDay) {
                result.allDayEvents.push(event);
            } else {
                result.timedEvents.push(event);
            }

            return result;
        },
        { allDayEvents: [], timedEvents: [] },
    );
}

export function formatCalendarEventTimeLabel(event: CalendarUiEvent): string {
    if (event.isAllDay) {
        return 'All day';
    }

    return `${event.startTime} - ${event.endTime}`;
}

export function getCalendarEventDateLabel(event: CalendarUiEvent): string {
    if (!event.isAllDay) {
        return `${event.date} · ${event.startTime} - ${event.endTime}`;
    }

    const exclusiveEndDate = parseISO(event.endAt);
    const inclusiveEndDate = subDays(exclusiveEndDate, 1);

    if (event.startAt === format(inclusiveEndDate, 'yyyy-MM-dd')) {
        return event.startAt;
    }

    return `${event.startAt} - ${format(inclusiveEndDate, 'yyyy-MM-dd')}`;
}

export function mapMockEventToCalendarUiEvent(event: MockEvent): CalendarUiEvent {
    return {
        calendarColor: '#1a73e8',
        calendarId: `mock:${event.calendar}`,
        calendarName: event.calendar,
        connectionId: 'mock-connection',
        date: event.date,
        description: event.description,
        endAt: `${event.date}T${event.endTime}:00.000Z`,
        endTime: event.endTime,
        htmlLink: null,
        id: event.id,
        isAllDay: false,
        location: event.location,
        provider: 'google',
        startAt: `${event.date}T${event.startTime}:00.000Z`,
        startTime: event.startTime,
        status: 'confirmed',
        title: event.title,
    };
}

export function mapMockEventToGoogleCalendarEvent(event: MockEvent): GoogleCalendarEvent {
    return {
        calendarColor: '#1a73e8',
        calendarId: `mock:${event.calendar}`,
        calendarName: event.calendar,
        connectionId: 'mock-connection',
        description: event.description,
        endAt: `${event.date}T${event.endTime}:00.000Z`,
        htmlLink: null,
        id: event.id,
        isAllDay: false,
        location: event.location,
        provider: 'google',
        startAt: `${event.date}T${event.startTime}:00.000Z`,
        status: 'confirmed',
        title: event.title,
    };
}

export function rangeIncludesDate(input: GoogleCalendarListEventsInput, isoDate: string): boolean {
    return input.rangeStart <= isoDate && isoDate < input.rangeEnd;
}
