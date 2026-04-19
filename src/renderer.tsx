import { QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
    RouterProvider,
    createBrowserHistory,
    createHashHistory,
    createRouter,
} from '@tanstack/react-router';
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/index.css';
import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';

const history = window.location.protocol === 'file:' ? createHashHistory() : createBrowserHistory();
const queryClient = createQueryClient();

const router = createRouter({
    routeTree,
    history,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('Missing #app root element');
}

createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider
            attribute='class'
            defaultTheme='system'
            disableTransitionOnChange
            enableSystem
            storageKey='day-flow-theme'>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster richColors />
                {/* {import.meta.env.DEV ? <TanStackRouterDevtools router={router} /> : null} */}
                {/* {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null} */}
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>,
);
