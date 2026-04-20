import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/query-keys';
import { getAppHealth, getAppPreferences } from '@/services/settings-api';

export const appHealthQueryOptions = queryOptions({
    queryFn: getAppHealth,
    queryKey: queryKeys.app.health(),
});

export const appPreferencesQueryOptions = queryOptions({
    queryFn: getAppPreferences,
    queryKey: queryKeys.settings.preferences(),
});
