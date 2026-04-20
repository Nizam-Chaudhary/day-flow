import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@/lib/utils';

function Collapsible({ className, ...props }: CollapsiblePrimitive.Root.Props) {
    return (
        <CollapsiblePrimitive.Root
            data-slot='collapsible'
            className={cn('flex w-full flex-col', className)}
            {...props}
        />
    );
}

function CollapsibleTrigger({ className, children, ...props }: CollapsiblePrimitive.Trigger.Props) {
    return (
        <CollapsiblePrimitive.Trigger
            data-slot='collapsible-trigger'
            className={cn(
                'group/collapsible-trigger relative flex flex-1 items-center justify-between gap-3 rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=collapsible-trigger-icon]:size-4 **:data-[slot=collapsible-trigger-icon]:shrink-0 **:data-[slot=collapsible-trigger-icon]:text-muted-foreground',
                className,
            )}
            {...props}>
            <span className='min-w-0 flex-1'>{children}</span>
            <HugeiconsIcon
                icon={ArrowDown01Icon}
                strokeWidth={2}
                data-slot='collapsible-trigger-icon'
                className='pointer-events-none self-center group-data-[panel-open]/collapsible-trigger:hidden'
            />
            <HugeiconsIcon
                icon={ArrowUp01Icon}
                strokeWidth={2}
                data-slot='collapsible-trigger-icon'
                className='pointer-events-none hidden self-center group-data-[panel-open]/collapsible-trigger:inline'
            />
        </CollapsiblePrimitive.Trigger>
    );
}

function CollapsibleContent({ className, children, ...props }: CollapsiblePrimitive.Panel.Props) {
    return (
        <CollapsiblePrimitive.Panel
            data-slot='collapsible-content'
            className='overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up'
            {...props}>
            <div
                className={cn(
                    'h-(--collapsible-panel-height) pt-0 pb-2.5 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
                    className,
                )}>
                {children}
            </div>
        </CollapsiblePrimitive.Panel>
    );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
