import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { mapFieldErrors } from "@/features/settings/form-errors";
import {
    appHealthQueryOptions,
    appPreferencesQueryOptions,
} from "@/features/settings/settings-query-options";
import { useUpdateAppPreferences } from "@/features/settings/use-update-app-preferences";
import { cn } from "@/lib/utils";
import {
    CALENDAR_VIEWS,
    type CalendarView,
    type UpdateAppPreferencesInput,
    type WeekStartsOn,
} from "@/shared/contracts/settings";

const weekStartsOnOptions = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
] as const satisfies Array<{ label: string; value: WeekStartsOn }>;

const calendarViewLabels: Record<CalendarView, string> = {
    day: "Day",
    month: "Month",
    week: "Week",
};

const emptyFormValues: UpdateAppPreferencesInput = {
    defaultCalendarView: "week",
    weekStartsOn: 1,
    dayStartsAt: "08:00",
};

export function SettingsPage() {
    const healthQuery = useQuery(appHealthQueryOptions);
    const preferencesQuery = useQuery(appPreferencesQueryOptions);
    const updatePreferences = useUpdateAppPreferences();

    const form = useForm({
        defaultValues: emptyFormValues,
        onSubmit: async ({ value }) => {
            await updatePreferences.mutateAsync(value);
        },
    });

    useEffect(() => {
        if (preferencesQuery.data) {
            form.reset({
                dayStartsAt: preferencesQuery.data.dayStartsAt,
                defaultCalendarView: preferencesQuery.data.defaultCalendarView,
                weekStartsOn: preferencesQuery.data.weekStartsOn,
            });
        }
    }, [form, preferencesQuery.data]);

    const isLoading = healthQuery.isPending || preferencesQuery.isPending;
    const error = healthQuery.error ?? preferencesQuery.error ?? updatePreferences.error;

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Foundation smoke path</p>
                    <h2 className="font-heading text-2xl font-semibold">Settings</h2>
                </div>
                <Link className={cn(buttonVariants({ size: "sm", variant: "outline" }))} to="/">
                    <HugeiconsIcon
                        data-icon="inline-start"
                        icon={ArrowLeft01Icon}
                        strokeWidth={2}
                    />
                    Back home
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Database diagnostics</CardTitle>
                    <CardDescription>
                        SQLite and Drizzle are running in the Electron main process only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">
                            Loading foundation health...
                        </p>
                    ) : (
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border bg-muted/50 p-4">
                                <dt className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                                    Database ready
                                </dt>
                                <dd className="mt-2 text-sm font-medium">
                                    {healthQuery.data?.databaseReady ? "Yes" : "No"}
                                </dd>
                            </div>
                            <div className="rounded-2xl border bg-muted/50 p-4">
                                <dt className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                                    Database path
                                </dt>
                                <dd className="mt-2 text-sm break-all">
                                    {healthQuery.data?.databasePath ?? "Unavailable"}
                                </dd>
                            </div>
                        </dl>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                        This persists one settings row to validate DB, IPC, Query, and Form wiring.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <p className="text-sm text-destructive" role="alert">
                            {error.message}
                        </p>
                    ) : null}

                    <form
                        className="mt-1"
                        onSubmit={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void form.handleSubmit();
                        }}
                    >
                        <FieldGroup>
                            <form.Field name="defaultCalendarView">
                                {(field) => (
                                    <Field
                                        data-invalid={hasFieldErrors(field)}
                                        orientation="vertical"
                                    >
                                        <FieldLabel htmlFor={field.name}>
                                            Default calendar view
                                        </FieldLabel>
                                        <FieldContent>
                                            <ToggleGroup
                                                aria-label="Default calendar view"
                                                id={field.name}
                                                value={field.state.value}
                                                onValueChange={(value) => {
                                                    if (isCalendarViewValue(value)) {
                                                        field.handleChange(value);
                                                    }
                                                }}
                                                variant="outline"
                                            >
                                                {CALENDAR_VIEWS.map((value) => (
                                                    <ToggleGroupItem key={value} value={value}>
                                                        {calendarViewLabels[value]}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                            <FieldDescription>
                                                The initial view the planner should open into.
                                            </FieldDescription>
                                            <FieldError
                                                errors={mapFieldErrors(field.state.meta.errors)}
                                            />
                                        </FieldContent>
                                    </Field>
                                )}
                            </form.Field>

                            <form.Field name="weekStartsOn">
                                {(field) => (
                                    <Field
                                        data-invalid={hasFieldErrors(field)}
                                        orientation="vertical"
                                    >
                                        <FieldLabel htmlFor={field.name}>Week starts on</FieldLabel>
                                        <FieldContent>
                                            <ToggleGroup
                                                aria-label="Week starts on"
                                                id={field.name}
                                                value={String(field.state.value)}
                                                onValueChange={(value) => {
                                                    if (value === "0" || value === "1") {
                                                        field.handleChange(
                                                            Number(value) as WeekStartsOn,
                                                        );
                                                    }
                                                }}
                                                variant="outline"
                                            >
                                                {weekStartsOnOptions.map((option) => (
                                                    <ToggleGroupItem
                                                        key={option.value}
                                                        value={String(option.value)}
                                                    >
                                                        {option.label}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                            <FieldDescription>
                                                Controls local week bucketing and calendar headings.
                                            </FieldDescription>
                                            <FieldError
                                                errors={mapFieldErrors(field.state.meta.errors)}
                                            />
                                        </FieldContent>
                                    </Field>
                                )}
                            </form.Field>

                            <form.Field
                                name="dayStartsAt"
                                validators={{
                                    onChange: ({ value }) =>
                                        /^\d{2}:\d{2}$/.test(value)
                                            ? undefined
                                            : "Use HH:mm, for example 08:00.",
                                }}
                            >
                                {(field) => (
                                    <Field
                                        data-invalid={hasFieldErrors(field)}
                                        orientation="vertical"
                                    >
                                        <FieldLabel htmlFor={field.name}>Day starts at</FieldLabel>
                                        <FieldContent>
                                            <Input
                                                aria-invalid={hasFieldErrors(field)}
                                                id={field.name}
                                                name={field.name}
                                                type="time"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                    field.handleChange(event.currentTarget.value)
                                                }
                                            />
                                            <FieldDescription>
                                                Stored as a serializable local time-of-day string.
                                            </FieldDescription>
                                            <FieldError
                                                errors={mapFieldErrors(field.state.meta.errors)}
                                            />
                                        </FieldContent>
                                    </Field>
                                )}
                            </form.Field>
                        </FieldGroup>
                    </form>
                </CardContent>
                <CardFooter className="justify-end gap-3 border-t">
                    <Button
                        disabled={updatePreferences.isPending || isLoading}
                        onClick={() => {
                            void form.handleSubmit();
                        }}
                        type="button"
                    >
                        {updatePreferences.isPending ? "Saving..." : "Save preferences"}
                    </Button>
                </CardFooter>
            </Card>
        </section>
    );
}

function hasFieldErrors(field: {
    state: {
        meta: {
            errors: unknown[];
            isTouched: boolean;
        };
    };
}): boolean {
    return field.state.meta.isTouched && field.state.meta.errors.length > 0;
}

function isCalendarViewValue(value: string): value is CalendarView {
    return CALENDAR_VIEWS.includes(value as CalendarView);
}
