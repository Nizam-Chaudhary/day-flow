import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { GoogleConnectionDetail } from '@/schemas/contracts/google-calendar';

import { queryKeys } from '@/lib/query/query-keys';
import {
    disconnectGoogleCalendarConnection,
    startGoogleCalendarConnection,
    syncGoogleCalendarConnection,
    updateGoogleCalendar,
    updateGoogleCalendarConnection,
} from '@/services/google-calendar-api';

function upsertGoogleCalendarConnectionDetail(
    connections: GoogleConnectionDetail[] | undefined,
    detail: GoogleConnectionDetail,
) {
    if (!connections) {
        return [detail];
    }

    const nextConnections = connections.map((connection) =>
        connection.id === detail.id ? detail : connection,
    );
    const hasExistingConnection = nextConnections.some((connection) => connection.id === detail.id);

    if (hasExistingConnection) {
        return nextConnections;
    }

    return [...connections, detail];
}

function setGoogleCalendarConnectionDetail(
    queryClient: ReturnType<typeof useQueryClient>,
    detail: GoogleConnectionDetail,
) {
    queryClient.setQueryData(queryKeys.googleCalendar.connection(detail.id), detail);
    queryClient.setQueryData(
        queryKeys.googleCalendar.connections(),
        (connections: GoogleConnectionDetail[] | undefined) =>
            upsertGoogleCalendarConnectionDetail(connections, detail),
    );
}

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
            setGoogleCalendarConnectionDetail(queryClient, detail);
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
        onSuccess: (detail) => {
            setGoogleCalendarConnectionDetail(queryClient, detail);
        },
    });
}

export function useSyncGoogleCalendarConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: syncGoogleCalendarConnection,
        onSuccess: async (detail) => {
            setGoogleCalendarConnectionDetail(queryClient, detail);
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
