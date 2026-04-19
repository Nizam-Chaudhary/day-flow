import { HugeiconsIcon } from '@hugeicons/react';
import { Link, useRouterState } from '@tanstack/react-router';
import * as React from 'react';

import { DayFlowLogo } from '@/components/brand/day-flow-logo';
import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarMenuBadge,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    footerNavItems,
    mainNavItems,
    shellBrand,
    type ShellNavItem,
} from '@/features/app-shell/mock-data';
import { cn } from '@/lib/utils';

function isActiveRoute(pathname: string, to: ShellNavItem['to']): boolean {
    return pathname === to || (to !== '/' && pathname.startsWith(`${to}/`));
}

function AppSidebarNav({ ariaLabel, items }: { ariaLabel: string; items: ShellNavItem[] }) {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <nav aria-label={ariaLabel}>
            <SidebarMenu className='gap-1'>
                {items.map((item) => {
                    const isActive = item.disabled ? false : isActiveRoute(pathname, item.to);

                    return (
                        <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton
                                aria-disabled={item.disabled || undefined}
                                disabled={item.disabled}
                                isActive={isActive}
                                tooltip={item.label}
                                render={
                                    item.disabled ? undefined : (
                                        <Link
                                            to={item.to}
                                            onClick={() => {
                                                if (isMobile) {
                                                    setOpenMobile(false);
                                                }
                                            }}
                                        />
                                    )
                                }
                                className={cn(item.disabled && 'text-sidebar-foreground/55')}>
                                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                                <span>{item.label}</span>
                                {item.badge ? (
                                    <SidebarMenuBadge
                                        aria-hidden='true'
                                        className='text-[10px] text-sidebar-foreground/55 uppercase'>
                                        {item.badge}
                                    </SidebarMenuBadge>
                                ) : null}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </nav>
    );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { open } = useSidebar();
    return (
        <Sidebar collapsible='icon' {...props}>
            {/* <SidebarHeader className={cn('gap-2', open ? 'ps-4' : '-mx-1')}> */}
            <SidebarHeader className={cn('w-full', open && '-mx-1')}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={<div />}
                            size='lg'
                            variant='static'
                            className='flex items-center justify-start'>
                            <div className='flex shrink-0 items-center justify-center'>
                                <DayFlowLogo kind='mark' label='Day Flow sidebar logo' size={32} />
                            </div>
                            <div className='min-w-0 group-data-[collapsible=icon]:hidden'>
                                <span className='block truncate font-heading text-lg font-semibold'>
                                    {shellBrand.name}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <Separator className={cn(open ? '-my-2 mb-3 ' : 'my-2')} />

            <SidebarContent className=' p-2'>
                <AppSidebarNav ariaLabel='Primary' items={mainNavItems} />
            </SidebarContent>

            <Separator />

            <SidebarFooter className='p-2'>
                <AppSidebarNav ariaLabel='Preferences' items={footerNavItems} />
            </SidebarFooter>
        </Sidebar>
    );
}
