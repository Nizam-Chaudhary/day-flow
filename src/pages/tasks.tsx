import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppShellActions } from "@/features/app-shell/app-shell-layout";
import { mockTasks, type MockTask } from "@/features/app-shell/mock-data";

export const Route = createFileRoute("/tasks")({
    component: TasksPage,
});

type TaskFilter = "completed" | "today" | "upcoming";

export function TasksPage() {
    const { openQuickAdd } = useAppShellActions();
    const [activeFilter, setActiveFilter] = useState<TaskFilter>("today");
    const [selectedTask, setSelectedTask] = useState<MockTask | null>(null);
    const visibleTasks = mockTasks.filter((task) => task.bucket === activeFilter);

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex max-w-3xl flex-col gap-2">
                    <p className="text-muted-foreground text-sm">Execution lane</p>
                    <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                        Tasks
                    </h2>
                    <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                        Filter the list down to what matters now, then open the right-side sheet for
                        linked details.
                    </p>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                    <ToggleGroup
                        aria-label="Task filter"
                        value={activeFilter}
                        onValueChange={(value) => {
                            if (
                                value === "today" ||
                                value === "upcoming" ||
                                value === "completed"
                            ) {
                                setActiveFilter(value);
                            }
                        }}
                        variant="outline"
                    >
                        <ToggleGroupItem value="today">Today</ToggleGroupItem>
                        <ToggleGroupItem value="upcoming">Upcoming</ToggleGroupItem>
                        <ToggleGroupItem value="completed">Completed</ToggleGroupItem>
                    </ToggleGroup>

                    <Button onClick={() => openQuickAdd("task")}>Add task</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Task list</CardTitle>
                    <CardDescription>
                        Dense cards with due state, priority, and linked Notion references.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {visibleTasks.map((task) => (
                        <button
                            key={task.id}
                            aria-label={`Open task ${task.title}`}
                            className="bg-background hover:bg-muted/60 flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-colors"
                            type="button"
                            onClick={() => {
                                setSelectedTask(task);
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <Checkbox checked={task.status === "Done"} disabled />
                                <div className="flex min-w-0 flex-1 flex-col gap-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-medium">{task.title}</p>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                Due {task.dueLabel}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline">{task.priority}</Badge>
                                            <Badge variant="secondary">{task.status}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{task.notionPage}</Badge>
                                        <Badge variant="outline">{task.linkedEvent}</Badge>
                                        <Badge variant="outline">Reminder {task.reminder}</Badge>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Sheet
                open={selectedTask !== null}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            >
                <SheetContent side="right">
                    <SheetHeader>
                        <SheetTitle>{selectedTask?.title}</SheetTitle>
                        <SheetDescription>{selectedTask?.dueLabel}</SheetDescription>
                    </SheetHeader>
                    {selectedTask ? (
                        <div className="flex flex-1 flex-col gap-6 px-6 pb-6">
                            <Card size="sm">
                                <CardHeader>
                                    <CardTitle className="text-sm">Task detail scaffold</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3">
                                    <DetailRow label="Priority" value={selectedTask.priority} />
                                    <DetailRow label="Status" value={selectedTask.status} />
                                    <DetailRow label="Reminder" value={selectedTask.reminder} />
                                </CardContent>
                            </Card>
                            <Card size="sm">
                                <CardHeader>
                                    <CardTitle className="text-sm">Linked context</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-3">
                                    <DetailRow
                                        label="Notion preview"
                                        value={selectedTask.notionPage}
                                    />
                                    <DetailRow
                                        label="Linked event"
                                        value={selectedTask.linkedEvent}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </section>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-background rounded-2xl border px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">{label}</p>
            <p className="mt-2 text-sm font-medium">{value}</p>
        </div>
    );
}
