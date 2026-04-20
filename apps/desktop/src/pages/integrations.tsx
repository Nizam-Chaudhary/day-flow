import { useQuery } from '@tanstack/react-query';
import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

import { IntegrationCategorySection } from '@/components/integrations/integration-category-section';
import {
    integrationCategories,
    type MockIntegrationCategory,
} from '@/features/app-shell/mock-data';
import { googleCalendarConnectionsQueryOptions } from '@/features/google-calendar/google-calendar-query-options';

export const Route = createFileRoute('/integrations')({
    component: IntegrationsPage,
});

function IntegrationsPage() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const connectionsQuery = useQuery(googleCalendarConnectionsQueryOptions);
    const googleConnectedAccountCount = connectionsQuery.data?.length ?? 0;
    const categories: MockIntegrationCategory[] = integrationCategories.map((category) =>
        category.id === 'calendar'
            ? {
                  ...category,
                  providers: category.providers.map((provider) =>
                      provider.id === 'google'
                          ? {
                                ...provider,
                                connectedAccountCount: googleConnectedAccountCount,
                                configurePath: '/integrations/google',
                                isConfigured: googleConnectedAccountCount > 0,
                                isConnected: googleConnectedAccountCount > 0,
                                status: 'available',
                            }
                          : provider,
                  ),
              }
            : category,
    );
    const isIntegrationsIndexRoute = pathname === '/integrations';

    return (
        <section className='flex flex-col gap-8'>
            {isIntegrationsIndexRoute ? (
                <>
                    <div className='flex max-w-3xl flex-col gap-2'>
                        <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                            Integrations
                        </h2>
                        <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                            Organize calendars, sync surfaces, and notification channels with a
                            clean setup model that stays predictable while integrations are still
                            coming soon.
                        </p>
                    </div>

                    <div className='flex flex-col gap-8'>
                        {categories.map((category) => (
                            <IntegrationCategorySection key={category.id} category={category} />
                        ))}
                    </div>
                </>
            ) : null}

            <Outlet />
        </section>
    );
}
