import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { runMockAction } from "@/features/app-shell/mock-actions";
import { mockReminders } from "@/features/app-shell/mock-data";

export const Route = createFileRoute("/reminders")({
    component: RemindersPage,
});

const reminderGroups = [
    { key: "upcoming", title: "Upcoming" },
    { key: "snoozed", title: "Snoozed" },
    { key: "completed", title: "Completed" },
] as const;

export function RemindersPage() {
    const navigate = useNavigate();
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    const handleAsyncAction = async (reminderId: string, action: "dismiss" | "snooze") => {
        setPendingAction(`${reminderId}:${action}`);

        const promise = runMockAction(
            action === "snooze" ? "Reminder snoozed." : "Reminder dismissed.",
        );

        void toast.promise(promise, {
            error: "Reminder action failed.",
            loading: action === "snooze" ? "Snoozing reminder..." : "Dismissing reminder...",
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
                <p className="text-muted-foreground text-sm">Follow-up lane</p>
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    Reminders
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                    Group upcoming, snoozed, and completed reminders in one predictable queue.
                </p>
            </div>

            {reminderGroups.map((group) => (
                <Card key={group.key}>
                    <CardHeader>
                        <CardTitle>{group.title}</CardTitle>
                        <CardDescription>
                            {group.key === "upcoming"
                                ? "The next reminders that need action."
                                : group.key === "snoozed"
                                  ? "Paused reminders waiting for a better moment."
                                  : "History for the reminder actions already cleared."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {mockReminders
                            .filter((reminder) => reminder.state === group.key)
                            .map((reminder) => {
                                const snoozeKey = `${reminder.id}:snooze`;
                                const dismissKey = `${reminder.id}:dismiss`;

                                return (
                                    <div
                                        key={reminder.id}
                                        className="bg-background flex flex-col gap-3 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium">{reminder.title}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {reminder.timeLabel}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="secondary">{reminder.source}</Badge>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    void navigate({
                                                        to:
                                                            reminder.source === "Event"
                                                                ? "/calendar"
                                                                : reminder.source === "Task"
                                                                  ? "/tasks"
                                                                  : "/notes",
                                                    });
                                                }}
                                            >
                                                Open
                                            </Button>
                                            <Button
                                                disabled={pendingAction !== null}
                                                variant="outline"
                                                onClick={() =>
                                                    void handleAsyncAction(reminder.id, "snooze")
                                                }
                                            >
                                                <LoadingSwap
                                                    isLoading={pendingAction === snoozeKey}
                                                >
                                                    <span>Snooze</span>
                                                </LoadingSwap>
                                            </Button>
                                            <Button
                                                disabled={pendingAction !== null}
                                                variant="ghost"
                                                onClick={() =>
                                                    void handleAsyncAction(reminder.id, "dismiss")
                                                }
                                            >
                                                <LoadingSwap
                                                    isLoading={pendingAction === dismissKey}
                                                >
                                                    <span>Dismiss</span>
                                                </LoadingSwap>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                    </CardContent>
                </Card>
            ))}
        </section>
    );
}
