import { queryOptions } from '@tanstack/react-query';

import { listGoogleCalendarConnections } from '@/features/google-calendar/google-calendar-api';
import { queryKeys } from '@/lib/query/query-keys';

export const googleCalendarConnectionsQueryOptions = queryOptions({
    queryFn: listGoogleCalendarConnections,
    queryKey: queryKeys.googleCalendar.connections(),
});
