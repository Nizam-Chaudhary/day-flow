import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/query-keys';
import { updateAppPreferences } from '@/services/settings-api';

export function useUpdateAppPreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAppPreferences,
        onSuccess: async (preferences) => {
            queryClient.setQueryData(queryKeys.settings.preferences(), preferences);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.settings.preferences(),
            });
        },
    });
}
