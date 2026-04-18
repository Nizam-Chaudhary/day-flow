import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    const { platform, versions } = window.electronApp;

    return (
        <main className="from-background via-muted/30 to-background min-h-screen bg-linear-to-b">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card className="overflow-hidden border bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 ring-slate-800">
                    <CardHeader className="gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex max-w-2xl flex-col gap-2">
                                <p className="text-xs font-semibold tracking-[0.28em] text-slate-300 uppercase">
                                    Day Flow
                                </p>
                                <CardTitle className="text-3xl leading-tight text-balance text-slate-50 sm:text-4xl">
                                    Plan the day before it plans you.
                                </CardTitle>
                                <CardDescription className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                    A local-first Electron shell with typed preload APIs,
                                    route-based navigation, and persistence foundations ready for
                                    planner features.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    className={cn(
                                        buttonVariants({ size: "sm", variant: "secondary" }),
                                        "bg-slate-100 text-slate-900 hover:bg-slate-200",
                                    )}
                                    to="/"
                                >
                                    Home
                                </Link>
                                <Link
                                    className={cn(
                                        buttonVariants({ size: "sm", variant: "outline" }),
                                        "border-slate-600 bg-slate-900/40 text-slate-50 hover:bg-slate-800",
                                    )}
                                    to="/settings"
                                >
                                    Settings
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <section
                    aria-label="Runtime information"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {[
                        { label: "Platform", value: platform },
                        { label: "Electron", value: versions.electron },
                        { label: "Chrome", value: versions.chrome },
                        { label: "Node", value: versions.node },
                    ].map((item) => (
                        <Card key={item.label} size="sm">
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                    {item.label}
                                </p>
                                <p className="text-lg font-semibold">{item.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Outlet />
            </div>
        </main>
    );
}
