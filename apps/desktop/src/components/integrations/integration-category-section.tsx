import { Link } from '@tanstack/react-router';

import type {
    MockIntegrationCategory,
    MockIntegrationProviderSummary,
} from '@/features/app-shell/mock-data';

import { IntegrationLogo } from '@/components/integrations/integration-logo';
import { Button } from '@/components/ui/button';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemHeader,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';

type IntegrationCategorySectionProps = {
    category: MockIntegrationCategory;
};

export function IntegrationCategorySection({ category }: IntegrationCategorySectionProps) {
    return (
        <section className='flex flex-col gap-4'>
            <div className='flex max-w-3xl flex-col gap-1.5'>
                <h3 className='font-heading text-xl font-semibold tracking-tight sm:text-2xl'>
                    {category.title}
                </h3>
                <p className='text-sm leading-6 text-muted-foreground'>{category.description}</p>
            </div>

            <ItemGroup>
                {category.providers.map((provider) => (
                    <IntegrationProviderItem key={provider.id} provider={provider} />
                ))}
            </ItemGroup>
        </section>
    );
}

function IntegrationProviderItem({ provider }: { provider: MockIntegrationProviderSummary }) {
    const metadata =
        provider.category === 'calendar'
            ? `${provider.connectedAccountCount ?? 0} account${
                  provider.connectedAccountCount === 1 ? '' : 's'
              } linked`
            : `Connected: ${provider.isConnected ? 'Yes' : 'No'} · Configured: ${
                  provider.isConfigured ? 'Yes' : 'No'
              }`;

    return (
        <Item
            variant='outline'
            className='gap-3 bg-background/70 px-4 py-4 has-[button]:items-center sm:flex-nowrap'>
            <ItemMedia variant='default'>
                <IntegrationLogo logoKey={provider.logoKey} name={provider.name} />
            </ItemMedia>

            <ItemContent className='min-w-0 gap-2'>
                <ItemHeader className='items-start gap-3'>
                    <ItemTitle className='w-full min-w-0 text-base'>{provider.name}</ItemTitle>
                </ItemHeader>

                <ItemDescription>{provider.description}</ItemDescription>

                <div
                    className={cn(
                        'text-sm text-muted-foreground',
                        provider.category !== 'calendar' && 'font-medium',
                    )}>
                    {metadata}
                </div>
            </ItemContent>

            <ItemActions className='w-full justify-end sm:w-auto'>
                {provider.status === 'available' && provider.configurePath ? (
                    <Button
                        nativeButton={false}
                        variant='outline'
                        className='w-full sm:w-auto'
                        render={<Link to={provider.configurePath} />}>
                        Configure
                    </Button>
                ) : (
                    <Button
                        disabled
                        variant='outline'
                        className='w-full border-dashed text-muted-foreground sm:w-auto'>
                        Coming soon
                    </Button>
                )}
            </ItemActions>
        </Item>
    );
}
