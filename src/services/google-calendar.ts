import { queryOptions } from '@tanstack/react-query';

import type { GoogleCalendarListEventsInput } from '@/schemas/contracts/google-calendar';

import { queryKeys } from '@/lib/query/query-keys';
import {
    listGoogleCalendarConnections,
    listGoogleCalendarEvents,
} from '@/services/google-calendar-api';

export const googleCalendarConnectionsQueryOptions = queryOptions({
    queryFn: listGoogleCalendarConnections,
    queryKey: queryKeys.googleCalendar.connections(),
});

export function googleCalendarEventsQueryOptions(input: GoogleCalendarListEventsInput) {
    return queryOptions({
        queryFn: () => listGoogleCalendarEvents(input),
        queryKey: queryKeys.googleCalendar.events(input.rangeStart, input.rangeEnd),
    });
}
