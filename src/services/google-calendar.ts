import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/query-keys';
import { listGoogleCalendarConnections } from '@/services/google-calendar-api';

export const googleCalendarConnectionsQueryOptions = queryOptions({
    queryFn: listGoogleCalendarConnections,
    queryKey: queryKeys.googleCalendar.connections(),
});
