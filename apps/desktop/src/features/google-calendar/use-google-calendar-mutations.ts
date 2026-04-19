import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
    disconnectGoogleCalendarConnection,
    startGoogleCalendarConnection,
    syncGoogleCalendarConnection,
    updateGoogleCalendar,
    updateGoogleCalendarConnection,
} from '@/features/google-calendar/google-calendar-api';
import { queryKeys } from '@/lib/query/query-keys';

export function useStartGoogleCalendarConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: startGoogleCalendarConnection,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.googleCalendar.connections(),
            });
        },
    });
}

export function useUpdateGoogleCalendarConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateGoogleCalendarConnection,
        onSuccess: async (detail) => {
            queryClient.setQueryData(queryKeys.googleCalendar.connection(detail.id), detail);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.googleCalendar.connections(),
            });
        },
    });
}

export function useUpdateGoogleCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateGoogleCalendar,
        onSuccess: async (detail) => {
            queryClient.setQueryData(queryKeys.googleCalendar.connection(detail.id), detail);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.googleCalendar.connections(),
            });
        },
    });
}

export function useSyncGoogleCalendarConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: syncGoogleCalendarConnection,
        onSuccess: async (detail) => {
            queryClient.setQueryData(queryKeys.googleCalendar.connection(detail.id), detail);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.googleCalendar.connections(),
            });
        },
    });
}

export function useDisconnectGoogleCalendarConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: disconnectGoogleCalendarConnection,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.googleCalendar.connections(),
            });
        },
    });
}
