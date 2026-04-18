import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as React from "react";

import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    footerNavItems,
    mainNavItems,
    shellBrand,
    type ShellNavItem,
} from "@/features/app-shell/mock-data";

function isActiveRoute(pathname: string, to: ShellNavItem["to"]): boolean {
    return pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
}

function AppSidebarNav({ ariaLabel, items }: { ariaLabel: string; items: ShellNavItem[] }) {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <nav aria-label={ariaLabel}>
            <SidebarMenu className="gap-1">
                {items.map((item) => {
                    const isActive = isActiveRoute(pathname, item.to);

                    return (
                        <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton
                                isActive={isActive}
                                tooltip={item.label}
                                render={
                                    <Link
                                        to={item.to}
                                        onClick={() => {
                                            if (isMobile) {
                                                setOpenMobile(false);
                                            }
                                        }}
                                    />
                                }
                            >
                                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </nav>
    );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="gap-2 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton render={<div />} size="lg" variant="static">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <HugeiconsIcon icon={shellBrand.icon} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                                <span className="block truncate font-heading text-sm font-semibold">
                                    {shellBrand.name}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <Separator />

            <SidebarContent className="p-2">
                <AppSidebarNav ariaLabel="Primary" items={mainNavItems} />
            </SidebarContent>

            <Separator />

            <SidebarFooter className="p-2">
                <AppSidebarNav ariaLabel="Preferences" items={footerNavItems} />
            </SidebarFooter>
        </Sidebar>
    );
}
