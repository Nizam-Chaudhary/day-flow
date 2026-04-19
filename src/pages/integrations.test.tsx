// @vitest-environment jsdom

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { describe, expect, it } from 'vitest';

import { Toaster } from '@/components/ui/sonner';
import { createQueryClient } from '@/lib/query/create-query-client';
import { routeTree } from '@/routeTree.gen';

describe('Integrations page', () => {
    it('renders grouped integration sections with disabled configure actions', async () => {
        renderApp('/integrations');

        expect(await screen.findByRole('heading', { name: 'Integrations' })).toBeTruthy();

        const headings = screen.getAllByRole('heading', { level: 3 });

        expect(headings.map((heading) => heading.textContent)).toEqual([
            'Calendar',
            'Sync',
            'Notifications & Other',
        ]);

        const calendarSection = headings[0].closest('section');
        const syncSection = headings[1].closest('section');
        const notificationsSection = headings[2].closest('section');

        expect(within(calendarSection as HTMLElement).getByText('Google Calendar')).toBeTruthy();
        expect(within(calendarSection as HTMLElement).getByText('Apple Calendar')).toBeTruthy();
        expect(within(calendarSection as HTMLElement).getByText('Outlook')).toBeTruthy();
        expect(within(calendarSection as HTMLElement).getByText('2 accounts linked')).toBeTruthy();
        expect(within(calendarSection as HTMLElement).getByText('0 accounts linked')).toBeTruthy();

        expect(within(syncSection as HTMLElement).getByText('Notion')).toBeTruthy();
        expect(
            within(syncSection as HTMLElement).getByText('Connected: No · Configured: No'),
        ).toBeTruthy();

        expect(within(notificationsSection as HTMLElement).getByText('Slack')).toBeTruthy();

        expect(screen.queryByText('Notion mapping preview')).toBeNull();
        expect(screen.queryByRole('table')).toBeNull();

        const configureButtons = screen.getAllByRole('button', { name: 'Coming soon' });

        expect(configureButtons).toHaveLength(5);

        for (const button of configureButtons) {
            expect(button).toHaveProperty('disabled', true);
        }

        expect(screen.getAllByText('Coming soon')).toHaveLength(5);
    });
});

function renderApp(initialPath: string) {
    const history = createMemoryHistory({
        initialEntries: [initialPath],
    });
    const queryClient = createQueryClient();
    const router = createRouter({
        history,
        routeTree,
    });

    return render(
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster />
            </QueryClientProvider>
        </ThemeProvider>,
    );
}
