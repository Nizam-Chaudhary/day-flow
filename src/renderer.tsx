import {
    RouterProvider,
    createBrowserHistory,
    createHashHistory,
    createRouter,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/index.css';
import { routeTree } from '@/routeTree.gen';

const history = window.location.protocol === 'file:' ? createHashHistory() : createBrowserHistory();

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
        <RouterProvider router={router} />
        {import.meta.env.DEV ? <TanStackRouterDevtools router={router} /> : null}
    </StrictMode>,
);
