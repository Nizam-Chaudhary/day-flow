import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 30 * 60 * 1000,
                refetchOnReconnect: false,
                refetchOnWindowFocus: false,
                retry: false,
                staleTime: Number.POSITIVE_INFINITY,
            },
        },
    });
}
