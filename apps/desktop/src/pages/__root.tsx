import { createRootRoute } from '@tanstack/react-router';

import { AppShellLayout } from '@/features/app-shell/app-shell-layout';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return <AppShellLayout />;
}
