import { createFileRoute, Link } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { CALENDAR_VIEWS } from "@/shared/contracts/settings";
import { useAppShellStore } from "@/stores/app-shell-store";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute("/")({
    component: HomePage,
});

function HomePage() {
    const { activeCalendarView, selectedDate, setActiveCalendarView } = useAppShellStore(
        useShallow((state) => ({
            activeCalendarView: state.activeCalendarView,
            selectedDate: state.selectedDate,
            setActiveCalendarView: state.setActiveCalendarView,
        })),
    );

    return (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
                <CardHeader>
                    <CardTitle>Foundation state is live</CardTitle>
                    <CardDescription>
                        Zustand now owns shell-only interaction state while persisted data stays out
                        of the client store.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                            Active calendar view
                        </p>
                        <ToggleGroup
                            aria-label="Active calendar view"
                            value={activeCalendarView}
                            onValueChange={(value) => {
                                if (
                                    CALENDAR_VIEWS.includes(
                                        value as (typeof CALENDAR_VIEWS)[number],
                                    )
                                ) {
                                    setActiveCalendarView(value as (typeof CALENDAR_VIEWS)[number]);
                                }
                            }}
                            variant="outline"
                        >
                            {CALENDAR_VIEWS.map((value) => (
                                <ToggleGroupItem key={value} value={value}>
                                    {value}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-muted/50 rounded-2xl border p-4">
                            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                Selected date
                            </p>
                            <p className="mt-2 text-lg font-semibold">{selectedDate}</p>
                        </div>
                        <div className="bg-muted/50 rounded-2xl border p-4">
                            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                Store boundary
                            </p>
                            <p className="mt-2 text-sm leading-6">
                                Query-backed settings live behind preload IPC. This panel only
                                touches ephemeral shell state.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Smoke path</CardTitle>
                    <CardDescription>
                        The first persistent flow is deliberately small so the domain model stays
                        fluid.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-sm leading-6">
                        Open settings to exercise Electron IPC, SQLite persistence, Drizzle
                        migrations, TanStack Query caching, and TanStack Form submission through one
                        narrow feature.
                    </p>
                    <Link className={cn(buttonVariants({ variant: "default" }))} to="/settings">
                        Open settings smoke path
                    </Link>
                </CardContent>
            </Card>
        </section>
    );
}
