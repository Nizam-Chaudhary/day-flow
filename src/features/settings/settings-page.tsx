import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingSwap } from '@/components/ui/loading-swap';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppShellActions } from '@/features/app-shell/app-shell-layout';
import { notionFieldMappings } from '@/features/app-shell/mock-data';
import { mapFieldErrors } from '@/features/settings/form-errors';
import {
    appHealthQueryOptions,
    appPreferencesQueryOptions,
} from '@/features/settings/settings-query-options';
import { useUpdateAppPreferences } from '@/features/settings/use-update-app-preferences';
import {
    CALENDAR_VIEWS,
    type CalendarView,
    type UpdateAppPreferencesInput,
    type WeekStartsOn,
} from '@/shared/contracts/settings';

const weekStartsOnOptions = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
] as const satisfies Array<{ label: string; value: WeekStartsOn }>;

const calendarViewLabels: Record<CalendarView, string> = {
    day: 'Day',
    month: 'Month',
    week: 'Week',
};

const emptyFormValues: UpdateAppPreferencesInput = {
    dayStartsAt: '08:00',
    defaultCalendarView: 'week',
    weekStartsOn: 1,
};

const settingsTabs = [
    { value: 'general', label: 'General' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'integrations', label: 'Integrations' },
    { value: 'sync-data', label: 'Sync & Data' },
    { value: 'import-export', label: 'Import / Export' },
] as const;

export function SettingsPage() {
    const { resolvedTheme, setTheme, theme } = useTheme();
    const { syncNow } = useAppShellActions();
    const healthQuery = useQuery(appHealthQueryOptions);
    const preferencesQuery = useQuery(appPreferencesQueryOptions);
    const updatePreferences = useUpdateAppPreferences();
    const [timezone, setTimezone] = useState('Asia/Kolkata');
    const [isSyncPending, setIsSyncPending] = useState(false);
    const error = healthQuery.error ?? preferencesQuery.error ?? updatePreferences.error;

    const form = useForm({
        defaultValues: emptyFormValues,
        onSubmit: async ({ value }) => {
            toast.promise(updatePreferences.mutateAsync(value), {
                error: (submitError) => submitError.message,
                loading: 'Saving preferences...',
                success: 'Preferences saved.',
            });
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

    const handleManualSync = async () => {
        setIsSyncPending(true);

        try {
            await syncNow();
        } finally {
            setIsSyncPending(false);
        }
    };

    return (
        <section className='flex flex-col gap-6'>
            <div className='flex max-w-3xl flex-col gap-2'>
                <p className='text-sm text-muted-foreground'>Preferences and diagnostics</p>
                <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                    Settings
                </h2>
                <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                    Keep the existing persistence path in General, then scaffold the remaining
                    product surfaces without expanding the current database contract.
                </p>
            </div>

            {error ? (
                <div className='rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
                    {error.message}
                </div>
            ) : null}

            <Tabs defaultValue='general'>
                <TabsList
                    className='h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b bg-background p-0 pb-2'
                    variant='line'>
                    {settingsTabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent className='flex flex-col gap-6 pt-4' value='general'>
                    <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
                        <Card>
                            <CardHeader>
                                <CardTitle>General preferences</CardTitle>
                                <CardDescription>
                                    These fields still persist through the current preload, IPC, and
                                    SQLite flow.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {preferencesQuery.isPending ? (
                                    <SettingsFormSkeleton />
                                ) : (
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            void form.handleSubmit();
                                        }}>
                                        <FieldGroup>
                                            <form.Field name='defaultCalendarView'>
                                                {(field) => (
                                                    <Field
                                                        data-invalid={hasFieldErrors(field)}
                                                        orientation='vertical'>
                                                        <FieldLabel htmlFor={field.name}>
                                                            Default calendar view
                                                        </FieldLabel>
                                                        <FieldContent>
                                                            <ToggleGroup
                                                                aria-label='Default calendar view'
                                                                id={field.name}
                                                                value={field.state.value}
                                                                onValueChange={(value) => {
                                                                    if (
                                                                        isCalendarViewValue(value)
                                                                    ) {
                                                                        field.handleChange(value);
                                                                    }
                                                                }}
                                                                variant='outline'>
                                                                {CALENDAR_VIEWS.map((value) => (
                                                                    <ToggleGroupItem
                                                                        key={value}
                                                                        value={value}>
                                                                        {calendarViewLabels[value]}
                                                                    </ToggleGroupItem>
                                                                ))}
                                                            </ToggleGroup>
                                                            <FieldDescription>
                                                                Controls the shared day/week/month
                                                                shell view on load.
                                                            </FieldDescription>
                                                            <FieldError
                                                                errors={mapFieldErrors(
                                                                    field.state.meta.errors,
                                                                )}
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                )}
                                            </form.Field>

                                            <form.Field name='weekStartsOn'>
                                                {(field) => (
                                                    <Field
                                                        data-invalid={hasFieldErrors(field)}
                                                        orientation='vertical'>
                                                        <FieldLabel htmlFor={field.name}>
                                                            Week starts on
                                                        </FieldLabel>
                                                        <FieldContent>
                                                            <ToggleGroup
                                                                aria-label='Week starts on'
                                                                id={field.name}
                                                                value={String(field.state.value)}
                                                                onValueChange={(value) => {
                                                                    if (
                                                                        value === '0' ||
                                                                        value === '1'
                                                                    ) {
                                                                        field.handleChange(
                                                                            Number(
                                                                                value,
                                                                            ) as WeekStartsOn,
                                                                        );
                                                                    }
                                                                }}
                                                                variant='outline'>
                                                                {weekStartsOnOptions.map(
                                                                    (option) => (
                                                                        <ToggleGroupItem
                                                                            key={option.value}
                                                                            value={String(
                                                                                option.value,
                                                                            )}>
                                                                            {option.label}
                                                                        </ToggleGroupItem>
                                                                    ),
                                                                )}
                                                            </ToggleGroup>
                                                            <FieldDescription>
                                                                Controls week headings and local
                                                                grouping.
                                                            </FieldDescription>
                                                            <FieldError
                                                                errors={mapFieldErrors(
                                                                    field.state.meta.errors,
                                                                )}
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                )}
                                            </form.Field>

                                            <form.Field
                                                name='dayStartsAt'
                                                validators={{
                                                    onChange: ({ value }) =>
                                                        /^\d{2}:\d{2}$/.test(value)
                                                            ? undefined
                                                            : 'Use HH:mm, for example 08:00.',
                                                }}>
                                                {(field) => (
                                                    <Field
                                                        data-invalid={hasFieldErrors(field)}
                                                        orientation='vertical'>
                                                        <FieldLabel htmlFor={field.name}>
                                                            Day starts at
                                                        </FieldLabel>
                                                        <FieldContent>
                                                            <Input
                                                                aria-invalid={hasFieldErrors(field)}
                                                                id={field.name}
                                                                name={field.name}
                                                                type='time'
                                                                value={field.state.value}
                                                                onBlur={field.handleBlur}
                                                                onChange={(event) =>
                                                                    field.handleChange(
                                                                        event.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                            <FieldDescription>
                                                                Stored as a serializable local
                                                                time-of-day string.
                                                            </FieldDescription>
                                                            <FieldError
                                                                errors={mapFieldErrors(
                                                                    field.state.meta.errors,
                                                                )}
                                                            />
                                                        </FieldContent>
                                                    </Field>
                                                )}
                                            </form.Field>
                                        </FieldGroup>
                                    </form>
                                )}
                            </CardContent>
                            <CardFooter className='justify-end gap-3 border-t'>
                                <Button
                                    aria-label='Save preferences'
                                    disabled={
                                        updatePreferences.isPending ||
                                        preferencesQuery.isPending ||
                                        healthQuery.isPending
                                    }
                                    onClick={() => {
                                        void form.handleSubmit();
                                    }}
                                    type='button'>
                                    <LoadingSwap isLoading={updatePreferences.isPending}>
                                        <span>Save preferences</span>
                                    </LoadingSwap>
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Interface</CardTitle>
                                <CardDescription>
                                    Client-side controls that shape the shell without changing the
                                    persistence contract yet.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className='flex flex-col gap-6'>
                                <FieldGroup>
                                    <Field orientation='vertical'>
                                        <FieldLabel htmlFor='theme-setting'>Theme</FieldLabel>
                                        <FieldContent>
                                            <ToggleGroup
                                                aria-label='Theme'
                                                id='theme-setting'
                                                value={theme ?? resolvedTheme ?? 'system'}
                                                onValueChange={(value) => {
                                                    if (
                                                        value === 'light' ||
                                                        value === 'dark' ||
                                                        value === 'system'
                                                    ) {
                                                        setTheme(value);
                                                    }
                                                }}
                                                variant='outline'>
                                                <ToggleGroupItem value='light'>
                                                    Light
                                                </ToggleGroupItem>
                                                <ToggleGroupItem value='dark'>Dark</ToggleGroupItem>
                                                <ToggleGroupItem value='system'>
                                                    System
                                                </ToggleGroupItem>
                                            </ToggleGroup>
                                            <FieldDescription>
                                                Theme is client-side for now and not stored in the
                                                database.
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>

                                    <Field orientation='vertical'>
                                        <FieldLabel htmlFor='timezone-setting'>Timezone</FieldLabel>
                                        <FieldContent>
                                            <Select value={timezone} onValueChange={setTimezone}>
                                                <SelectTrigger
                                                    className='w-full'
                                                    id='timezone-setting'>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value='Asia/Kolkata'>
                                                            Asia/Kolkata
                                                        </SelectItem>
                                                        <SelectItem value='UTC'>UTC</SelectItem>
                                                        <SelectItem value='America/New_York'>
                                                            America/New_York
                                                        </SelectItem>
                                                        <SelectItem value='Europe/London'>
                                                            Europe/London
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FieldDescription>
                                                Placeholder only until timezone joins the persisted
                                                preferences contract.
                                            </FieldDescription>
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent className='pt-4' value='calendar'>
                    <SettingsScaffoldCard
                        description='Calendar-specific defaults stay UI-only in this pass.'
                        title='Calendar settings'>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor='default-calendar'>Default calendar</FieldLabel>
                                <FieldContent>
                                    <Select defaultValue='work'>
                                        <SelectTrigger className='w-full' id='default-calendar'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value='work'>Work calendar</SelectItem>
                                                <SelectItem value='personal'>
                                                    Personal calendar
                                                </SelectItem>
                                                <SelectItem value='combined'>
                                                    Combined view
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FieldContent>
                            </Field>

                            <Field orientation='horizontal'>
                                <FieldLabel htmlFor='conflicts-switch'>
                                    Future conflict handling
                                </FieldLabel>
                                <FieldContent>
                                    <Switch defaultChecked id='conflicts-switch' />
                                    <FieldDescription>
                                        Prefer the primary source when event details disagree.
                                    </FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </SettingsScaffoldCard>
                </TabsContent>

                <TabsContent className='pt-4' value='tasks'>
                    <SettingsScaffoldCard
                        description='Task defaults are scaffolded here until task persistence expands.'
                        title='Task settings'>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor='default-priority'>Default priority</FieldLabel>
                                <FieldContent>
                                    <Select defaultValue='medium'>
                                        <SelectTrigger className='w-full' id='default-priority'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value='low'>Low</SelectItem>
                                                <SelectItem value='medium'>Medium</SelectItem>
                                                <SelectItem value='high'>High</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FieldContent>
                            </Field>

                            <Field orientation='horizontal'>
                                <FieldLabel htmlFor='auto-link-tasks'>
                                    Auto-link tasks to events
                                </FieldLabel>
                                <FieldContent>
                                    <Switch id='auto-link-tasks' />
                                    <FieldDescription>Only a UI scaffold for now.</FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </SettingsScaffoldCard>
                </TabsContent>

                <TabsContent className='pt-4' value='notifications'>
                    <SettingsScaffoldCard
                        description='Notification timing and channel controls are scaffolded for the first shell pass.'
                        title='Notifications'>
                        <FieldGroup>
                            <Field orientation='horizontal'>
                                <FieldLabel htmlFor='notification-enable'>
                                    Enable in-app notifications
                                </FieldLabel>
                                <FieldContent>
                                    <Switch defaultChecked id='notification-enable' />
                                    <FieldDescription>
                                        In-app notifications are ready before Slack routing is.
                                    </FieldDescription>
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor='snooze-default'>Default snooze</FieldLabel>
                                <FieldContent>
                                    <Select defaultValue='15'>
                                        <SelectTrigger className='w-full' id='snooze-default'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value='10'>10 minutes</SelectItem>
                                                <SelectItem value='15'>15 minutes</SelectItem>
                                                <SelectItem value='30'>30 minutes</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </SettingsScaffoldCard>
                </TabsContent>

                <TabsContent className='pt-4' value='integrations'>
                    <SettingsScaffoldCard
                        description='Field mapping UI is presentational in this pass and backed by mock rows only.'
                        title='Integrations config'>
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
                    </SettingsScaffoldCard>
                </TabsContent>

                <TabsContent className='flex flex-col gap-6 pt-4' value='sync-data'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Manual sync</CardTitle>
                            <CardDescription>
                                Trigger prototype sync feedback without changing the backend
                                contract.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex flex-col gap-1'>
                                <p className='font-medium'>Run sync now</p>
                                <p className='text-sm text-muted-foreground'>
                                    Uses the shared shell sync action and toast feedback.
                                </p>
                            </div>
                            <Button
                                disabled={isSyncPending}
                                onClick={() => void handleManualSync()}>
                                <LoadingSwap isLoading={isSyncPending}>
                                    <span>Sync now</span>
                                </LoadingSwap>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Database diagnostics</CardTitle>
                            <CardDescription>
                                SQLite and Drizzle remain isolated in the Electron main process.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {healthQuery.isPending ? (
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    <Skeleton className='h-28 rounded-2xl' />
                                    <Skeleton className='h-28 rounded-2xl' />
                                </div>
                            ) : (
                                <div className='grid gap-4 sm:grid-cols-2'>
                                    <DiagnosticCard
                                        label='Database ready'
                                        value={healthQuery.data?.databaseReady ? 'Yes' : 'No'}
                                    />
                                    <DiagnosticCard
                                        label='Database path'
                                        value={healthQuery.data?.databasePath ?? 'Unavailable'}
                                    />
                                    <DiagnosticCard
                                        label='Last migration'
                                        value={healthQuery.data?.lastMigrationAt ?? 'Not reported'}
                                    />
                                    <DiagnosticCard
                                        label='Preferences row'
                                        value={
                                            preferencesQuery.data
                                                ? `${preferencesQuery.data.updatedAt}`
                                                : 'Unavailable'
                                        }
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent className='pt-4' value='import-export'>
                    <SettingsScaffoldCard
                        description='Import/export remains a UI shell until file flows and validation are designed.'
                        title='Import / Export'>
                        <div className='flex flex-wrap gap-3'>
                            <Button variant='outline'>Export config</Button>
                            <Button variant='ghost'>Import config</Button>
                            <Badge variant='secondary'>Backups not configured</Badge>
                        </div>
                    </SettingsScaffoldCard>
                </TabsContent>
            </Tabs>
        </section>
    );
}

function SettingsScaffoldCard({
    children,
    description,
    title,
}: {
    children: React.ReactNode;
    description: string;
    title: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function DiagnosticCard({ label, value }: { label: string; value: string }) {
    return (
        <div className='rounded-2xl border bg-muted/40 p-4'>
            <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase'>{label}</p>
            <p className='mt-2 text-sm font-medium break-all'>{value}</p>
        </div>
    );
}

function SettingsFormSkeleton() {
    return (
        <div className='flex flex-col gap-6'>
            <Skeleton className='h-24 rounded-2xl' />
            <Skeleton className='h-24 rounded-2xl' />
            <Skeleton className='h-20 rounded-2xl' />
        </div>
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
