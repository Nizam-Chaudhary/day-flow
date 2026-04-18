import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { runMockAction } from "@/features/app-shell/mock-actions";
import {
    integrationIcons,
    integrationProviders,
    notionFieldMappings,
} from "@/features/app-shell/mock-data";

export const Route = createFileRoute("/integrations")({
    component: IntegrationsPage,
});

export function IntegrationsPage() {
    const [pendingProvider, setPendingProvider] = useState<string | null>(null);

    const handleProviderAction = async (providerId: string, successMessage: string) => {
        setPendingProvider(providerId);

        const promise = runMockAction(successMessage);

        void toast.promise(promise, {
            error: "Provider action failed.",
            loading: "Updating provider connection...",
            success: (message) => message,
        });

        try {
            await promise;
        } finally {
            setPendingProvider(null);
        }
    };

    return (
        <section className="flex flex-col gap-6">
            <div className="flex max-w-3xl flex-col gap-2">
                <p className="text-muted-foreground text-sm">Connections and mappings</p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    Integrations
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                    Provider cards stay modular and readable, with connection state, sync context,
                    and a first mapping preview for Notion.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {integrationProviders.map((provider) => (
                    <Card key={provider.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-2xl">
                                    <HugeiconsIcon
                                        icon={integrationIcons[provider.id]}
                                        strokeWidth={2}
                                    />
                                </div>
                                <Badge
                                    variant={
                                        provider.status === "Connected" ? "secondary" : "outline"
                                    }
                                >
                                    {provider.status}
                                </Badge>
                            </div>
                            <CardTitle>{provider.name}</CardTitle>
                            <CardDescription>{provider.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="bg-background rounded-2xl border px-4 py-3">
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                    Last sync
                                </p>
                                <p className="mt-2 text-sm font-medium">{provider.lastSyncText}</p>
                            </div>
                            <Button
                                disabled={pendingProvider !== null}
                                variant={provider.status === "Connected" ? "outline" : "default"}
                                onClick={() =>
                                    void handleProviderAction(
                                        provider.id,
                                        provider.status === "Connected"
                                            ? `${provider.name} configuration opened.`
                                            : `${provider.name} connection started.`,
                                    )
                                }
                            >
                                <LoadingSwap isLoading={pendingProvider === provider.id}>
                                    <span>
                                        {provider.status === "Connected" ? "Configure" : "Connect"}
                                    </span>
                                </LoadingSwap>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Notion mapping preview</CardTitle>
                    <CardDescription>
                        Preview how planner fields will align with the selected database before the
                        backend contract expands.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>App field</TableHead>
                                <TableHead>Notion field</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notionFieldMappings.map((mapping) => (
                                <TableRow key={mapping.appField}>
                                    <TableCell>{mapping.appField}</TableCell>
                                    <TableCell>{mapping.notionField}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </section>
    );
}
