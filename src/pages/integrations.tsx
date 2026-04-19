import { createFileRoute } from '@tanstack/react-router';

import { IntegrationCategorySection } from '@/components/integrations/integration-category-section';
import { integrationCategories } from '@/features/app-shell/mock-data';

export const Route = createFileRoute('/integrations')({
    component: IntegrationsPage,
});

function IntegrationsPage() {
    return (
        <section className='flex flex-col gap-8'>
            <div className='flex max-w-3xl flex-col gap-2'>
                <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                    Integrations
                </h2>
                <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                    Organize calendars, sync surfaces, and notification channels with a clean setup
                    model that stays predictable while integrations are still coming soon.
                </p>
            </div>

            <div className='flex flex-col gap-8'>
                {integrationCategories.map((category) => (
                    <IntegrationCategorySection key={category.id} category={category} />
                ))}
            </div>
        </section>
    );
}
