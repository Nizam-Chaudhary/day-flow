import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import type {
    GoogleCalendarSummary,
    GoogleConnectionDetail,
    GoogleReminderChannel,
} from '@/schemas/contracts/google-calendar';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    GOOGLE_REMINDER_LEAD_OPTIONS,
    GOOGLE_REMINDER_CHANNELS,
    GOOGLE_SYNC_INTERVAL_OPTIONS,
} from '@/schemas/contracts/google-calendar';
import { googleCalendarConnectionsQueryOptions } from '@/services/google-calendar';
import {
    useDisconnectGoogleCalendarConnection,
    useStartGoogleCalendarConnection,
    useSyncGoogleCalendarConnection,
    useUpdateGoogleCalendar,
} from '@/services/google-calendar-mutations';

export function GoogleCalendarIntegrationPage() {
    const connectionsQuery = useQuery(googleCalendarConnectionsQueryOptions);
    const startConnection = useStartGoogleCalendarConnection();
    const syncConnection = useSyncGoogleCalendarConnection();
    const disconnectConnection = useDisconnectGoogleCalendarConnection();
    const [mutationError, setMutationError] = useState<string | null>(null);

    const handleAsyncAction = async (action: () => Promise<unknown>) => {
        setMutationError(null);

        try {
            await action();
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : 'Google Calendar action failed.',
            );
        }
    };

    const error = mutationError ?? connectionsQuery.error?.message ?? null;
    const connections = connectionsQuery.data ?? [];

    return (
        <section className='flex flex-col gap-6'>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link to='/integrations' />}>
                            Integrations
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Google Calendar</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className='flex flex-col gap-3'>
                <div className='flex flex-col gap-2'>
                    <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                        Google Calendar
                    </h2>
                    <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
                        Link multiple Google accounts, control sync and reminder behavior per
                        calendar, and keep event colors aligned with your planning surface.
                    </p>
                </div>

                {error ? (
                    <div className='rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
                        {error}
                    </div>
                ) : null}
            </div>

            <Card>
                <CardHeader className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='space-y-1'>
                        <CardTitle>Connection summary</CardTitle>
                        <CardDescription>
                            {connections.length === 0
                                ? 'No Google accounts are linked yet.'
                                : `${connections.length} account${connections.length === 1 ? '' : 's'} linked.`}
                        </CardDescription>
                    </div>
                    <Button
                        disabled={startConnection.isPending}
                        onClick={() => {
                            void handleAsyncAction(async () => {
                                await startConnection.mutateAsync();
                            });
                        }}>
                        Link Google account
                    </Button>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                    <div className='flex flex-wrap gap-2'>
                        <Badge variant='secondary'>
                            Linked accounts:{' '}
                            {connectionsQuery.isPending ? '...' : connections.length}
                        </Badge>
                        <Badge variant='outline'>Per-calendar sync settings</Badge>
                        <Badge variant='outline'>Per-calendar reminder settings</Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        Secure token storage is preferred. If the OS credential store is
                        unavailable, Day Flow falls back to unencrypted SQLite storage and marks
                        that account visibly below.
                    </p>
                </CardContent>
            </Card>

            {connectionsQuery.isPending ? (
                <GoogleConnectionSkeleton />
            ) : connections.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No linked Google accounts</CardTitle>
                        <CardDescription>
                            Connect a Google account to start loading calendars and events.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Accordion
                    defaultValue={connections[0] ? [connections[0].id] : undefined}
                    className='rounded-2xl border px-4'>
                    {connections.map((connection) => (
                        <AccordionItem key={connection.id} value={connection.id}>
                            <AccordionTrigger className='py-4'>
                                <div className='flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between'>
                                    <div className='flex flex-col gap-1'>
                                        <span className='font-medium'>
                                            {connection.displayName}
                                        </span>
                                        <span className='text-sm text-muted-foreground'>
                                            {connection.email}
                                        </span>
                                    </div>
                                    <div className='flex flex-wrap gap-2'>
                                        <Badge variant='secondary'>
                                            {connection.selectedCalendarCount} calendars
                                        </Badge>
                                        <Badge variant='outline'>
                                            Last sync: {connection.lastSyncAt ?? 'Not synced yet'}
                                        </Badge>
                                        {connection.credentialStorageMode === 'sqlite_plaintext' ? (
                                            <Badge variant='destructive'>
                                                Unencrypted SQLite token storage
                                            </Badge>
                                        ) : (
                                            <Badge variant='outline'>OS keychain</Badge>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className='pb-6'>
                                <GoogleConnectionPanel
                                    connection={connection}
                                    onDisconnect={() =>
                                        handleAsyncAction(async () => {
                                            await disconnectConnection.mutateAsync(connection.id);
                                        })
                                    }
                                    onSync={() =>
                                        handleAsyncAction(async () => {
                                            await syncConnection.mutateAsync(connection.id);
                                        })
                                    }
                                />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </section>
    );
}

function GoogleConnectionPanel({
    connection,
    onDisconnect,
    onSync,
}: {
    connection: GoogleConnectionDetail;
    onDisconnect: () => void;
    onSync: () => void;
}) {
    return (
        <div className='flex flex-col gap-4'>
            <Card>
                <CardContent className='flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='flex flex-col gap-2'>
                        <div className='flex flex-wrap gap-2'>
                            <Badge variant='secondary'>{connection.email}</Badge>
                            <Badge variant='outline'>{connection.scopes.join(', ')}</Badge>
                        </div>
                        {connection.credentialStorageMode === 'sqlite_plaintext' ? (
                            <p className='text-sm text-destructive'>
                                Secure credential storage is unavailable on this machine. Tokens are
                                stored unencrypted in SQLite for this account.
                            </p>
                        ) : (
                            <p className='text-sm text-muted-foreground'>
                                Tokens for this account are stored in the system keychain.
                            </p>
                        )}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <Button variant='outline' onClick={onSync}>
                            Sync now
                        </Button>
                        <Button variant='destructive' onClick={onDisconnect}>
                            Disconnect account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className='flex flex-col gap-4'>
                {connection.calendars.map((calendar) => (
                    <GoogleCalendarSettingsCard key={calendar.id} calendar={calendar} />
                ))}
            </div>
        </div>
    );
}

function GoogleCalendarSettingsCard({ calendar }: { calendar: GoogleCalendarSummary }) {
    const updateCalendar = useUpdateGoogleCalendar();
    const [colorDraft, setColorDraft] = useState(calendar.colorOverride ?? calendar.effectiveColor);

    const handleCalendarUpdate = async (input: Partial<GoogleCalendarSummary>) => {
        await updateCalendar.mutateAsync({
            calendarId: calendar.id,
            ...(input.colorOverride !== undefined ? { colorOverride: input.colorOverride } : {}),
            ...(input.isSelected !== undefined ? { isSelected: input.isSelected } : {}),
            ...(input.reminderChannel !== undefined
                ? { reminderChannel: input.reminderChannel as GoogleReminderChannel }
                : {}),
            ...(input.reminderEnabled !== undefined
                ? { reminderEnabled: input.reminderEnabled }
                : {}),
            ...(input.reminderLeadMinutes !== undefined
                ? { reminderLeadMinutes: input.reminderLeadMinutes }
                : {}),
            ...(input.syncEnabled !== undefined ? { syncEnabled: input.syncEnabled } : {}),
            ...(input.syncIntervalMinutes !== undefined
                ? { syncIntervalMinutes: input.syncIntervalMinutes }
                : {}),
        });
    };

    return (
        <Card>
            <CardHeader className='gap-3'>
                <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='space-y-2'>
                        <CardTitle className='text-base'>{calendar.name}</CardTitle>
                        <div className='flex flex-wrap gap-2'>
                            <Badge variant='secondary'>{calendar.type}</Badge>
                            <Badge variant='outline'>{calendar.accessRole}</Badge>
                            {calendar.isPrimary ? <Badge variant='outline'>Primary</Badge> : null}
                        </div>
                    </div>
                    <div className='flex items-center gap-3'>
                        <span
                            aria-hidden='true'
                            className='size-4 rounded-full border'
                            style={{ backgroundColor: calendar.effectiveColor }}
                        />
                        <span className='text-sm text-muted-foreground'>
                            Effective color {calendar.effectiveColor}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
                <FieldGroup className='grid gap-4 lg:grid-cols-2'>
                    <Field orientation='horizontal'>
                        <FieldLabel htmlFor={`${calendar.id}-selected`}>Enabled</FieldLabel>
                        <FieldContent>
                            <Switch
                                checked={calendar.isSelected}
                                id={`${calendar.id}-selected`}
                                onCheckedChange={(checked) => {
                                    void handleCalendarUpdate({ isSelected: checked });
                                }}
                            />
                            <FieldDescription>Include this calendar in Day Flow.</FieldDescription>
                        </FieldContent>
                    </Field>

                    <Field orientation='horizontal'>
                        <FieldLabel htmlFor={`${calendar.id}-sync-enabled`}>
                            Sync enabled
                        </FieldLabel>
                        <FieldContent>
                            <Switch
                                checked={calendar.syncEnabled}
                                disabled={!calendar.isSelected}
                                id={`${calendar.id}-sync-enabled`}
                                onCheckedChange={(checked) => {
                                    void handleCalendarUpdate({ syncEnabled: checked });
                                }}
                            />
                            <FieldDescription>
                                Scheduled and manual sync only run for enabled calendars.
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                </FieldGroup>

                <Separator />

                <FieldGroup className='grid gap-4 xl:grid-cols-4'>
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendar.id}-sync-interval`}>
                            Sync interval
                        </FieldLabel>
                        <FieldContent>
                            <Select
                                disabled={!calendar.isSelected || !calendar.syncEnabled}
                                value={String(calendar.syncIntervalMinutes)}
                                onValueChange={(value) => {
                                    void handleCalendarUpdate({
                                        syncIntervalMinutes: Number(
                                            value,
                                        ) as GoogleCalendarSummary['syncIntervalMinutes'],
                                    });
                                }}>
                                <SelectTrigger id={`${calendar.id}-sync-interval`}>
                                    <SelectValue placeholder='Select interval' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {GOOGLE_SYNC_INTERVAL_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={String(option)}>
                                                {option} min
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    <Field orientation='horizontal'>
                        <FieldLabel htmlFor={`${calendar.id}-reminder-enabled`}>
                            Reminder enabled
                        </FieldLabel>
                        <FieldContent>
                            <Switch
                                checked={calendar.reminderEnabled}
                                disabled={!calendar.isSelected}
                                id={`${calendar.id}-reminder-enabled`}
                                onCheckedChange={(checked) => {
                                    void handleCalendarUpdate({ reminderEnabled: checked });
                                }}
                            />
                            <FieldDescription>
                                Store reminder preferences for later delivery.
                            </FieldDescription>
                        </FieldContent>
                    </Field>

                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendar.id}-reminder-channel`}>
                            Reminder channel
                        </FieldLabel>
                        <FieldContent>
                            <Select
                                disabled={!calendar.isSelected || !calendar.reminderEnabled}
                                value={calendar.reminderChannel}
                                onValueChange={(value) => {
                                    void handleCalendarUpdate({
                                        reminderChannel: value as GoogleReminderChannel,
                                    });
                                }}>
                                <SelectTrigger id={`${calendar.id}-reminder-channel`}>
                                    <SelectValue placeholder='Select channel' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {GOOGLE_REMINDER_CHANNELS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option.replace('_', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendar.id}-reminder-lead`}>
                            Reminder lead
                        </FieldLabel>
                        <FieldContent>
                            <Select
                                disabled={!calendar.isSelected || !calendar.reminderEnabled}
                                value={String(calendar.reminderLeadMinutes)}
                                onValueChange={(value) => {
                                    void handleCalendarUpdate({
                                        reminderLeadMinutes: Number(
                                            value,
                                        ) as GoogleCalendarSummary['reminderLeadMinutes'],
                                    });
                                }}>
                                <SelectTrigger id={`${calendar.id}-reminder-lead`}>
                                    <SelectValue placeholder='Select lead time' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {GOOGLE_REMINDER_LEAD_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={String(option)}>
                                                {option === 0
                                                    ? 'At time of event'
                                                    : `${option} min before`}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>
                </FieldGroup>

                <Separator />

                <FieldGroup className='grid gap-4 xl:grid-cols-[120px_1fr_160px]'>
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendar.id}-color-picker`}>
                            Calendar color
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${calendar.id}-color-picker`}
                                type='color'
                                value={colorDraft}
                                onChange={(event) => {
                                    setColorDraft(event.currentTarget.value);
                                }}
                                onBlur={() => {
                                    void handleCalendarUpdate({ colorOverride: colorDraft });
                                }}
                            />
                        </FieldContent>
                    </Field>

                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendar.id}-color-hex`}>Hex override</FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${calendar.id}-color-hex`}
                                value={colorDraft}
                                onChange={(event) => {
                                    setColorDraft(event.currentTarget.value);
                                }}
                                onBlur={() => {
                                    void handleCalendarUpdate({ colorOverride: colorDraft });
                                }}
                            />
                            <FieldDescription>
                                Leave the provider color in place or set a local override.
                            </FieldDescription>
                        </FieldContent>
                    </Field>

                    <Field orientation='vertical'>
                        <FieldLabel>Preview</FieldLabel>
                        <FieldContent>
                            <div className='flex h-9 items-center gap-3 rounded-lg border px-3'>
                                <span
                                    aria-hidden='true'
                                    className='size-4 rounded-full border'
                                    style={{ backgroundColor: colorDraft }}
                                />
                                <span className='text-sm'>{colorDraft}</span>
                            </div>
                        </FieldContent>
                    </Field>
                </FieldGroup>
            </CardContent>
        </Card>
    );
}

function GoogleConnectionSkeleton() {
    return (
        <div className='grid gap-4'>
            {[0, 1].map((index) => (
                <Card key={index}>
                    <CardHeader className='gap-3'>
                        <Skeleton className='h-6 w-48' />
                        <Skeleton className='h-4 w-72' />
                    </CardHeader>
                    <CardContent className='grid gap-3'>
                        <Skeleton className='h-10 w-full' />
                        <Skeleton className='h-10 w-full' />
                        <Skeleton className='h-10 w-full' />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
