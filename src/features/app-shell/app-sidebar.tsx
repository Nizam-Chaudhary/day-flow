import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useRouterState } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import {
    primaryNavItems,
    shellBrand,
    shellCommandHints,
    shellNotifications,
} from "@/features/app-shell/mock-data";
import { cn } from "@/lib/utils";

export function AppSidebar({
    mode = "desktop",
    onNavigate,
}: {
    mode?: "desktop" | "mobile";
    onNavigate?: () => void;
}) {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    return (
        <div className="flex h-full flex-col gap-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl ring-1 ring-inset ring-current/10">
                        <HugeiconsIcon icon={shellBrand.icon} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.24em] uppercase">
                            Operating System
                        </span>
                        <h1 className="font-heading text-xl font-semibold">{shellBrand.name}</h1>
                    </div>
                </div>
                <p className="text-muted-foreground max-w-xs text-sm leading-6">
                    {shellBrand.blurb}
                </p>
            </div>

            <nav aria-label="Primary" className="flex flex-col gap-1.5">
                {primaryNavItems.map((item) => {
                    const isActive =
                        pathname === item.to ||
                        (item.to !== "/" && pathname.startsWith(`${item.to}/`));

                    return (
                        <Link
                            key={item.to}
                            className={cn(
                                "hover:bg-accent/70 focus-visible:border-ring focus-visible:ring-ring/50 flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm transition-colors outline-none focus-visible:ring-[3px]",
                                isActive
                                    ? "bg-card text-foreground border-border shadow-xs"
                                    : "border-transparent text-muted-foreground",
                            )}
                            to={item.to}
                            onClick={onNavigate}
                        >
                            <div
                                className={cn(
                                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-xs leading-5">{item.description}</span>
                            </div>
                            {item.to === "/" ? (
                                <Badge className="self-center" variant="secondary">
                                    Today
                                </Badge>
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            <Card className={cn(mode === "mobile" ? "mt-2" : "mt-auto")} size="sm">
                <CardHeader>
                    <CardTitle className="text-sm">Fast moves</CardTitle>
                    <CardDescription>
                        Keep capture and navigation inside one or two keystrokes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {shellCommandHints.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                            <span className="text-sm">{item.label}</span>
                            <Kbd>{item.key}</Kbd>
                        </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 border-t pt-3">
                        <span className="text-sm">Unread notifications</span>
                        <Badge variant="outline">
                            {shellNotifications.filter((item) => item.unread).length}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
