import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { runMockAction } from "@/features/app-shell/mock-actions";
import { noteDatabases, recentPages } from "@/features/app-shell/mock-data";

export const Route = createFileRoute("/notes")({
    component: NotesPage,
});

export function NotesPage() {
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    const handleAction = async (actionId: string, successMessage: string) => {
        setPendingAction(actionId);

        const promise = runMockAction(successMessage);

        void toast.promise(promise, {
            error: "Action failed.",
            loading: "Opening connected note context...",
            success: (message) => message,
        });

        try {
            await promise;
        } finally {
            setPendingAction(null);
        }
    };

    return (
        <section className="flex flex-col gap-6">
            <div className="flex max-w-3xl flex-col gap-2">
                <p className="text-muted-foreground text-sm">Bridge, not editor</p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    Notes
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                    Keep databases, recent pages, and quick-open actions close to the work without
                    recreating the editor surface.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Connected databases</CardTitle>
                        <CardDescription>
                            Shared Notion databases available for tasks, notes, and references.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {noteDatabases.map((database) => (
                            <div
                                key={database.name}
                                className="bg-background flex flex-col gap-2 rounded-2xl border p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium">{database.name}</p>
                                    <Badge variant="secondary">{database.pages} pages</Badge>
                                </div>
                                <p className="text-muted-foreground text-sm leading-6">
                                    {database.description}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent pages</CardTitle>
                        <CardDescription>
                            Quick open surfaces for the pages most likely to be linked into today’s
                            work.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {recentPages.map((page) => (
                            <div
                                key={page.id}
                                className="bg-background flex flex-col gap-4 rounded-2xl border p-4"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{page.title}</p>
                                        <Badge variant="outline">{page.lastEdited}</Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm leading-6">
                                        {page.summary}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        disabled={pendingAction !== null}
                                        variant="outline"
                                        onClick={() =>
                                            void handleAction(
                                                `${page.id}:open`,
                                                "Opened page in Notion.",
                                            )
                                        }
                                    >
                                        <LoadingSwap
                                            isLoading={pendingAction === `${page.id}:open`}
                                        >
                                            <span>Open in Notion</span>
                                        </LoadingSwap>
                                    </Button>
                                    <Button
                                        disabled={pendingAction !== null}
                                        variant="ghost"
                                        onClick={() =>
                                            void handleAction(
                                                `${page.id}:link`,
                                                "Prototype link attached to planner context.",
                                            )
                                        }
                                    >
                                        <LoadingSwap
                                            isLoading={pendingAction === `${page.id}:link`}
                                        >
                                            <span>Link to Task/Event</span>
                                        </LoadingSwap>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
