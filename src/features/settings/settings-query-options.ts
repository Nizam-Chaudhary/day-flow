import { queryOptions } from '@tanstack/react-query';

import { getAppHealth, getAppPreferences } from '@/features/settings/settings-api';
import { queryKeys } from '@/lib/query/query-keys';

export const appHealthQueryOptions = queryOptions({
    queryFn: getAppHealth,
    queryKey: queryKeys.app.health(),
});

export const appPreferencesQueryOptions = queryOptions({
    queryFn: getAppPreferences,
    queryKey: queryKeys.settings.preferences(),
});
