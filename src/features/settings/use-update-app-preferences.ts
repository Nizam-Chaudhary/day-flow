import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateAppPreferences } from "@/features/settings/settings-api";
import { queryKeys } from "@/lib/query/query-keys";

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
