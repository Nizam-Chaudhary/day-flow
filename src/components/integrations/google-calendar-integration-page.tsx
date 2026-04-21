import type { FormAsyncValidateOrFn, FormValidateOrFn } from '@tanstack/form-core';
import type { ReactFormExtendedApi } from '@tanstack/react-form';

import { useForm, useStore } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
    GoogleCalendarColorType,
    GoogleCalendarSummary,
    GoogleConnectionDetail,
    UpdateGoogleCalendarInput,
} from '@/schemas/contracts/google-calendar';

import googleLogo from '@/assets/integration-logos/google-color.svg';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    GOOGLE_CALENDAR_CURATED_COLORS,
    findGoogleCalendarCuratedColor,
    getGoogleCalendarColorOptions,
    normalizeGoogleCalendarColor,
} from '@/lib/google-calendar-colors';
import {
    GOOGLE_REMINDER_LEAD_OPTIONS,
    GOOGLE_SYNC_INTERVAL_OPTIONS,
} from '@/schemas/contracts/google-calendar';
import { googleCalendarConnectionsQueryOptions } from '@/services/google-calendar';
import {
    useDisconnectGoogleCalendarConnection,
    useStartGoogleCalendarConnection,
    useSyncGoogleCalendarConnection,
    useUpdateGoogleCalendar,
} from '@/services/google-calendar-mutations';

const CALENDAR_AUTOSAVE_DEBOUNCE_MS = 350;
const CALENDAR_AUTOSAVE_SAVED_MS = 1500;

type CalendarAutosaveState = 'error' | 'idle' | 'saved' | 'saving';

interface CalendarFormValues {
    calendarColorType: GoogleCalendarColorType;
    colorOverride: string;
    isSelected: boolean;
    reminderEnabled: boolean;
    reminderLeadMinutes: GoogleCalendarSummary['reminderLeadMinutes'];
    syncEnabled: boolean;
    syncIntervalMinutes: GoogleCalendarSummary['syncIntervalMinutes'];
}

type CalendarFormApi = ReactFormExtendedApi<
    CalendarFormValues,
    FormValidateOrFn<CalendarFormValues> | undefined,
    FormValidateOrFn<CalendarFormValues> | undefined,
    FormAsyncValidateOrFn<CalendarFormValues> | undefined,
    FormValidateOrFn<CalendarFormValues> | undefined,
    FormAsyncValidateOrFn<CalendarFormValues> | undefined,
    FormValidateOrFn<CalendarFormValues> | undefined,
    FormAsyncValidateOrFn<CalendarFormValues> | undefined,
    FormValidateOrFn<CalendarFormValues> | undefined,
    FormAsyncValidateOrFn<CalendarFormValues> | undefined,
    FormAsyncValidateOrFn<CalendarFormValues> | undefined,
    unknown
>;
type CalendarFieldState<TValue> = {
    handleBlur: () => void;
    handleChange: (value: TValue) => void;
    state: {
        value: TValue;
    };
};

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
                    <div className='flex items-center gap-3'>
                        <ProviderAvatar size='default' />
                        <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                            Google Calendar
                        </h2>
                    </div>
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

            <Card className='border border-border/70 bg-card/95'>
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
                        className='w-full sm:w-auto'
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
                        <Badge variant='outline'>Sync controls</Badge>
                        <Badge variant='outline'>Reminder controls</Badge>
                    </div>
                    <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
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
                <div className='rounded-2xl border border-border/70 p-4'>
                    <Accordion className='gap-0'>
                        {connections.map((connection) => (
                            <AccordionItem
                                key={connection.id}
                                value={connection.id}
                                className='not-last:mb-4 not-last:border-b not-last:pb-4'>
                                <AccordionTrigger
                                    aria-label={`Toggle ${connection.displayName} calendars`}
                                    render={<div />}
                                    nativeButton={false}
                                    className='rounded-xl border border-transparent bg-muted/40 px-3 py-3.5 text-left transition-[background-color,border-color,box-shadow,transform,color] duration-200 ease-out hover:border-border hover:bg-muted/55 hover:shadow-sm aria-expanded:border-border aria-expanded:bg-muted/55 aria-expanded:shadow-sm'>
                                    <div className='flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                                        <div className='min-w-0 flex-1'>
                                            <div className='flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 overflow-hidden'>
                                                <p className='truncate text-sm font-medium text-foreground sm:text-base'>
                                                    {connection.displayName}
                                                </p>
                                                <span className='shrink-0 text-muted-foreground/70'>
                                                    ·
                                                </span>
                                                <p className='min-w-0 truncate text-sm text-muted-foreground'>
                                                    {connection.email}
                                                </p>
                                            </div>
                                            <div className='mt-2 flex max-w-full flex-wrap items-center gap-2'>
                                                <Badge variant='secondary'>
                                                    {connection.selectedCalendarCount} calendar
                                                    {connection.selectedCalendarCount === 1
                                                        ? ''
                                                        : 's'}
                                                </Badge>
                                                <Badge variant='outline'>
                                                    {getConnectionSyncBadgeLabel(connection)}
                                                </Badge>
                                                {connection.credentialStorageMode ===
                                                'sqlite_plaintext' ? (
                                                    <Badge variant='destructive'>
                                                        Unencrypted storage
                                                    </Badge>
                                                ) : (
                                                    <Badge variant='outline'>OS keychain</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
                                            <Button
                                                variant='outline'
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    void handleAsyncAction(async () => {
                                                        await syncConnection.mutateAsync(
                                                            connection.id,
                                                        );
                                                    });
                                                }}>
                                                Sync now
                                            </Button>
                                            <Button
                                                variant='destructive'
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    void handleAsyncAction(async () => {
                                                        await disconnectConnection.mutateAsync(
                                                            connection.id,
                                                        );
                                                    });
                                                }}>
                                                Disconnect account
                                            </Button>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className='pt-4 pb-2'>
                                    <GoogleConnectionPanel connection={connection} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            )}
        </section>
    );
}

function GoogleConnectionPanel({ connection }: { connection: GoogleConnectionDetail }) {
    return (
        <div className='flex flex-col gap-4'>
            {connection.calendars.map((calendar) => (
                <GoogleCalendarSettingsCard key={calendar.id} calendar={calendar} />
            ))}
        </div>
    );
}

function GoogleCalendarSettingsCard({ calendar }: { calendar: GoogleCalendarSummary }) {
    const updateCalendar = useUpdateGoogleCalendar();
    const [saveState, setSaveState] = useState<CalendarAutosaveState>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);
    const incomingServerValues = useMemo(() => getCalendarFormValues(calendar), [calendar]);
    const form = useForm({
        defaultValues: incomingServerValues,
    });
    const values = useStore(form.store, (state) => state.values);
    const lastSyncedValuesRef = useRef(incomingServerValues);
    const queuedValuesRef = useRef<CalendarFormValues | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submittedValuesRef = useRef<CalendarFormValues | null>(null);
    const isSavingRef = useRef(false);

    const valuesSignature = serializeCalendarFormValues(values);
    const incomingSignature = serializeCalendarFormValues(incomingServerValues);
    const isCalendarEnabled = values.isSelected;
    const effectiveColor = normalizeGoogleCalendarColor(values.colorOverride);
    const curatedColorOptions = useMemo(
        () => getGoogleCalendarColorOptions(values.colorOverride),
        [values.colorOverride],
    );
    const selectedCuratedColor =
        findGoogleCalendarCuratedColor(values.colorOverride)?.value ??
        curatedColorOptions[0]?.value ??
        GOOGLE_CALENDAR_CURATED_COLORS[0].value;

    useEffect(() => {
        const shouldResetForm =
            areCalendarFormValuesEqual(form.state.values, lastSyncedValuesRef.current) ||
            (submittedValuesRef.current !== null &&
                areCalendarFormValuesEqual(form.state.values, submittedValuesRef.current));

        lastSyncedValuesRef.current = incomingServerValues;

        if (shouldResetForm) {
            form.reset(incomingServerValues);
        }
    }, [form, incomingServerValues, incomingSignature]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (savedTimerRef.current) {
                clearTimeout(savedTimerRef.current);
            }
        };
    }, []);

    const clearSavedStateTimer = () => {
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
            savedTimerRef.current = null;
        }
    };

    const setSavedState = () => {
        clearSavedStateTimer();
        setSaveState('saved');
        savedTimerRef.current = setTimeout(() => {
            setSaveState('idle');
            savedTimerRef.current = null;
        }, CALENDAR_AUTOSAVE_SAVED_MS);
    };

    const dispatchSave = useCallback(
        async (nextValues: CalendarFormValues) => {
            const updateInput = buildGoogleCalendarUpdateInput(
                lastSyncedValuesRef.current,
                nextValues,
                calendar.id,
            );

            if (!updateInput) {
                setSaveError(null);

                if (saveState !== 'error') {
                    setSaveState('idle');
                }

                return;
            }

            isSavingRef.current = true;
            submittedValuesRef.current = nextValues;
            clearSavedStateTimer();
            setSaveError(null);
            setSaveState('saving');

            let didSaveSucceed = false;

            try {
                const detail = await updateCalendar.mutateAsync(updateInput);
                const updatedCalendar = detail.calendars.find(
                    (candidate) => candidate.id === calendar.id,
                );
                const canonicalValues = updatedCalendar
                    ? getCalendarFormValues(updatedCalendar)
                    : nextValues;
                const currentValues = form.store.state.values;

                lastSyncedValuesRef.current = canonicalValues;
                didSaveSucceed = true;

                if (areCalendarFormValuesEqual(currentValues, nextValues)) {
                    form.reset(canonicalValues);
                }

                setSaveError(null);
                setSavedState();
            } catch (error) {
                setSaveState('error');
                setSaveError(
                    error instanceof Error
                        ? error.message
                        : 'Calendar settings could not be saved.',
                );
            } finally {
                isSavingRef.current = false;

                if (didSaveSucceed && queuedValuesRef.current) {
                    const queuedValues = queuedValuesRef.current;
                    queuedValuesRef.current = null;

                    if (!areCalendarFormValuesEqual(queuedValues, lastSyncedValuesRef.current)) {
                        void dispatchSave(queuedValues);
                    }
                } else if (!didSaveSucceed) {
                    queuedValuesRef.current = null;
                }
            }
        },
        [calendar.id, form, saveState, updateCalendar],
    );

    const scheduleSave = useCallback(
        (nextValues: CalendarFormValues, immediate = false) => {
            const hasPendingChanges = !areCalendarFormValuesEqual(
                nextValues,
                lastSyncedValuesRef.current,
            );

            if (!hasPendingChanges) {
                queuedValuesRef.current = null;

                if (!isSavingRef.current && saveState !== 'error') {
                    setSaveState('idle');
                }

                return;
            }

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }

            if (isSavingRef.current) {
                queuedValuesRef.current = nextValues;
                return;
            }

            if (immediate) {
                void dispatchSave(nextValues);
                return;
            }

            debounceTimerRef.current = setTimeout(() => {
                debounceTimerRef.current = null;
                void dispatchSave(nextValues);
            }, CALENDAR_AUTOSAVE_DEBOUNCE_MS);
        },
        [dispatchSave, saveState],
    );

    useEffect(() => {
        scheduleSave(values);
    }, [scheduleSave, values, valuesSignature]);

    const flushAutosave = () => {
        scheduleSave(form.store.state.values, true);
    };

    return (
        <Card
            className='overflow-hidden border border-border/70 bg-card/95 shadow-sm'
            data-testid={`calendar-card-${calendar.id}`}>
            <CardHeader className='gap-5 border-b border-border/70 pb-5'>
                <CalendarCardHeader
                    calendar={calendar}
                    effectiveColor={effectiveColor}
                    form={form}
                    saveError={saveError}
                    saveState={saveState}
                />
            </CardHeader>

            {isCalendarEnabled ? (
                <CardContent className='flex flex-col gap-6 pt-6'>
                    <CalendarSyncSection calendarId={calendar.id} form={form} />

                    <Separator />

                    <CalendarReminderSection calendarId={calendar.id} form={form} />

                    <Separator />

                    <CalendarColorSection
                        calendarId={calendar.id}
                        colorOptions={curatedColorOptions}
                        effectiveColor={effectiveColor}
                        form={form}
                        selectedCuratedColor={selectedCuratedColor}
                        onColorBlur={flushAutosave}
                    />
                </CardContent>
            ) : null}
        </Card>
    );
}

function CalendarCardHeader({
    calendar,
    effectiveColor,
    form,
    saveError,
    saveState,
}: {
    calendar: GoogleCalendarSummary;
    effectiveColor: string;
    form: CalendarFormApi;
    saveError: string | null;
    saveState: CalendarAutosaveState;
}) {
    return (
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0 space-y-3'>
                <div className='flex items-center gap-3'>
                    <span
                        aria-hidden='true'
                        className='size-4 shrink-0 rounded-full border border-border/70 shadow-sm'
                        data-testid={`calendar-effective-color-${calendar.id}`}
                        style={{ backgroundColor: effectiveColor }}
                    />
                    <CardTitle className='text-base sm:text-lg'>{calendar.name}</CardTitle>
                </div>
                <div className='flex flex-wrap gap-2'>
                    <Badge variant='secondary'>{calendar.type}</Badge>
                    <Badge variant='outline'>{calendar.accessRole}</Badge>
                    {calendar.isPrimary ? <Badge variant='outline'>Primary</Badge> : null}
                </div>
                <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                    <span>{effectiveColor}</span>
                    <span aria-hidden='true'>·</span>
                    <span>In-app reminders</span>
                </div>
            </div>

            <div className='flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 sm:items-end'>
                <div className='flex items-center gap-3'>
                    <span className='text-sm font-medium'>Enabled</span>
                    <form.Field name='isSelected'>
                        {(field: CalendarFieldState<boolean>) => (
                            <Switch
                                aria-label='Enabled'
                                checked={field.state.value}
                                id={`${calendar.id}-selected`}
                                onCheckedChange={(checked) => {
                                    field.handleChange(checked);
                                }}
                            />
                        )}
                    </form.Field>
                </div>
                <CalendarSaveState saveError={saveError} saveState={saveState} />
            </div>
        </div>
    );
}

function CalendarSyncSection({ calendarId, form }: { calendarId: string; form: CalendarFormApi }) {
    const isCalendarEnabled = useStore(form.store, (state) => state.values.isSelected);
    const isSyncEnabled = useStore(form.store, (state) => state.values.syncEnabled);

    return (
        <div className='grid gap-5 lg:grid-cols-[minmax(0,220px)_minmax(0,220px)]'>
            <form.Field name='syncEnabled'>
                {(field: CalendarFieldState<boolean>) => (
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendarId}-sync-enabled`}>Sync enabled</FieldLabel>
                        <FieldContent>
                            <div className='rounded-2xl border border-border/70 bg-muted/15 p-4'>
                                <Switch
                                    checked={field.state.value}
                                    disabled={!isCalendarEnabled}
                                    id={`${calendarId}-sync-enabled`}
                                    onCheckedChange={(checked) => {
                                        field.handleChange(checked);
                                    }}
                                />
                            </div>
                            <FieldDescription>
                                Scheduled and manual sync only run for enabled calendars.
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                )}
            </form.Field>

            <form.Field name='syncIntervalMinutes'>
                {(field: CalendarFieldState<CalendarFormValues['syncIntervalMinutes']>) => (
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendarId}-sync-interval`}>
                            Sync interval
                        </FieldLabel>
                        <FieldContent>
                            <Select
                                disabled={!isCalendarEnabled || !isSyncEnabled}
                                value={String(field.state.value)}
                                onValueChange={(value) => {
                                    field.handleChange(
                                        Number(value) as CalendarFormValues['syncIntervalMinutes'],
                                    );
                                }}>
                                <SelectTrigger
                                    id={`${calendarId}-sync-interval`}
                                    data-testid={`calendar-sync-interval-${calendarId}`}>
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
                )}
            </form.Field>
        </div>
    );
}

function CalendarReminderSection({
    calendarId,
    form,
}: {
    calendarId: string;
    form: CalendarFormApi;
}) {
    const isCalendarEnabled = useStore(form.store, (state) => state.values.isSelected);
    const isReminderEnabled = useStore(form.store, (state) => state.values.reminderEnabled);

    return (
        <div className='grid gap-5 lg:grid-cols-[minmax(0,220px)_minmax(0,240px)]'>
            <form.Field name='reminderEnabled'>
                {(field: CalendarFieldState<boolean>) => (
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendarId}-reminder-enabled`}>
                            Reminder enabled
                        </FieldLabel>
                        <FieldContent>
                            <div className='rounded-2xl border border-border/70 bg-muted/15 p-4'>
                                <Switch
                                    checked={field.state.value}
                                    disabled={!isCalendarEnabled}
                                    id={`${calendarId}-reminder-enabled`}
                                    onCheckedChange={(checked) => {
                                        field.handleChange(checked);
                                    }}
                                />
                            </div>
                            <FieldDescription>
                                In-app reminder delivery only in this build.
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                )}
            </form.Field>

            <form.Field name='reminderLeadMinutes'>
                {(field: CalendarFieldState<CalendarFormValues['reminderLeadMinutes']>) => (
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendarId}-reminder-lead`}>
                            Default reminder time
                        </FieldLabel>
                        <FieldContent>
                            <Select
                                disabled={!isCalendarEnabled || !isReminderEnabled}
                                value={String(field.state.value)}
                                onValueChange={(value) => {
                                    field.handleChange(
                                        Number(value) as CalendarFormValues['reminderLeadMinutes'],
                                    );
                                }}>
                                <SelectTrigger
                                    id={`${calendarId}-reminder-lead`}
                                    data-testid={`calendar-reminder-lead-${calendarId}`}>
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
                )}
            </form.Field>
        </div>
    );
}

function CalendarColorSection({
    calendarId,
    colorOptions,
    effectiveColor,
    form,
    onColorBlur,
    selectedCuratedColor,
}: {
    calendarId: string;
    colorOptions: ReturnType<typeof getGoogleCalendarColorOptions>;
    effectiveColor: string;
    form: CalendarFormApi;
    onColorBlur: () => void;
    selectedCuratedColor: string;
}) {
    const calendarColorType = useStore(form.store, (state) => state.values.calendarColorType);

    return (
        <div className='grid gap-5 xl:grid-cols-[minmax(0,220px)_minmax(0,240px)_minmax(0,240px)]'>
            <form.Field name='calendarColorType'>
                {(field: CalendarFieldState<CalendarFormValues['calendarColorType']>) => (
                    <Field orientation='vertical'>
                        <FieldLabel htmlFor={`${calendarId}-color-type`}>
                            Calendar color type
                        </FieldLabel>
                        <FieldContent>
                            <ToggleGroup
                                aria-label='Calendar color type'
                                id={`${calendarId}-color-type`}
                                variant='outline'>
                                <ToggleGroupItem
                                    pressed={field.state.value === 'curated'}
                                    value='curated'
                                    onPressedChange={(pressed) => {
                                        if (!pressed) {
                                            return;
                                        }

                                        field.handleChange('curated');
                                        form.setFieldValue('colorOverride', selectedCuratedColor);
                                    }}>
                                    Curated
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    pressed={field.state.value === 'custom'}
                                    value='custom'
                                    onPressedChange={(pressed) => {
                                        if (pressed) {
                                            field.handleChange('custom');
                                        }
                                    }}>
                                    Custom
                                </ToggleGroupItem>
                            </ToggleGroup>
                            <FieldDescription>
                                Pick a curated swatch or keep a custom override.
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                )}
            </form.Field>

            {calendarColorType === 'curated' ? (
                <form.Field name='colorOverride'>
                    {(field: CalendarFieldState<string>) => (
                        <Field orientation='vertical'>
                            <FieldLabel htmlFor={`${calendarId}-curated-color`}>
                                Calendar color
                            </FieldLabel>
                            <FieldContent>
                                <Select
                                    value={selectedCuratedColor}
                                    onValueChange={(value) => {
                                        field.handleChange(normalizeGoogleCalendarColor(value));
                                    }}>
                                    <SelectTrigger
                                        id={`${calendarId}-curated-color`}
                                        data-testid={`calendar-curated-color-${calendarId}`}>
                                        <SelectValue placeholder='Select a color' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {colorOptions.map((option) => (
                                                <SelectItem key={option.id} value={option.value}>
                                                    <span
                                                        aria-hidden='true'
                                                        className='size-3 rounded-full border border-border/70'
                                                        style={{ backgroundColor: option.value }}
                                                    />
                                                    <span>{option.label}</span>
                                                    <span className='text-xs text-muted-foreground'>
                                                        {option.value}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                    )}
                </form.Field>
            ) : (
                <form.Field name='colorOverride'>
                    {(field: CalendarFieldState<string>) => (
                        <FieldGroup className='grid gap-4 md:grid-cols-[96px_minmax(0,1fr)] xl:col-span-1'>
                            <Field orientation='vertical'>
                                <FieldLabel htmlFor={`${calendarId}-color-picker`}>
                                    Picker
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`${calendarId}-color-picker`}
                                        type='color'
                                        value={normalizeGoogleCalendarColor(field.state.value)}
                                        onBlur={() => {
                                            field.handleBlur();
                                            onColorBlur();
                                        }}
                                        onChange={(event) => {
                                            field.handleChange(
                                                normalizeGoogleCalendarColor(
                                                    event.currentTarget.value,
                                                ),
                                            );
                                        }}
                                    />
                                </FieldContent>
                            </Field>

                            <Field orientation='vertical'>
                                <FieldLabel htmlFor={`${calendarId}-color-hex`}>
                                    Calendar color
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`${calendarId}-color-hex`}
                                        value={field.state.value}
                                        onBlur={(event) => {
                                            field.handleChange(
                                                normalizeGoogleCalendarColor(
                                                    event.currentTarget.value,
                                                ),
                                            );
                                            field.handleBlur();
                                            onColorBlur();
                                        }}
                                        onChange={(event) => {
                                            field.handleChange(event.currentTarget.value);
                                        }}
                                    />
                                    <FieldDescription>
                                        Save any six-digit hex override and preview it immediately.
                                    </FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    )}
                </form.Field>
            )}

            <Field orientation='vertical'>
                <FieldLabel>Preview</FieldLabel>
                <FieldContent>
                    <div className='flex min-h-28 flex-col justify-between rounded-2xl border border-border/70 bg-muted/15 p-4'>
                        <div className='flex items-start justify-between gap-4'>
                            <div className='space-y-1'>
                                <p className='text-sm font-medium'>Calendar effective color</p>
                                <p className='text-xs text-muted-foreground'>
                                    This color chip is used across the planner surface.
                                </p>
                            </div>
                            <span
                                aria-hidden='true'
                                className='size-6 rounded-full border border-border/70 shadow-sm'
                                style={{ backgroundColor: effectiveColor }}
                            />
                        </div>
                        <div className='flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/70 px-3 py-2'>
                            <span className='text-sm font-medium'>{effectiveColor}</span>
                            <span
                                className='h-3 flex-1 rounded-full'
                                style={{ backgroundColor: effectiveColor }}
                            />
                        </div>
                    </div>
                </FieldContent>
            </Field>
        </div>
    );
}

function CalendarSaveState({
    saveError,
    saveState,
}: {
    saveError: string | null;
    saveState: CalendarAutosaveState;
}) {
    if (saveState === 'saving') {
        return <span className='text-xs font-medium text-muted-foreground'>Saving...</span>;
    }

    if (saveState === 'saved') {
        return <span className='text-xs font-medium text-emerald-600'>Saved</span>;
    }

    if (saveState === 'error') {
        return <span className='text-xs font-medium text-destructive'>{saveError}</span>;
    }

    return null;
}

function ProviderAvatar({ size = 'sm' }: { size?: 'default' | 'sm' | 'lg' }) {
    return (
        <Avatar
            size={size}
            className='border border-border/70 bg-background shadow-sm'
            data-testid='google-calendar-provider-avatar'>
            <AvatarImage
                alt='Google Calendar logo'
                className='object-contain p-1'
                src={googleLogo}
            />
            <AvatarFallback>G</AvatarFallback>
        </Avatar>
    );
}

function getCalendarFormValues(calendar: GoogleCalendarSummary): CalendarFormValues {
    return {
        calendarColorType: calendar.calendarColorType,
        colorOverride: normalizeGoogleCalendarColor(
            calendar.colorOverride ?? calendar.effectiveColor,
        ),
        isSelected: calendar.isSelected,
        reminderEnabled: calendar.reminderEnabled,
        reminderLeadMinutes: calendar.reminderLeadMinutes,
        syncEnabled: calendar.syncEnabled,
        syncIntervalMinutes: calendar.syncIntervalMinutes,
    };
}

export function buildGoogleCalendarUpdateInput(
    previousValues: CalendarFormValues,
    nextValues: CalendarFormValues,
    calendarId: string,
): UpdateGoogleCalendarInput | null {
    const updateInput: UpdateGoogleCalendarInput = {
        calendarId,
    };

    if (previousValues.isSelected !== nextValues.isSelected) {
        updateInput.isSelected = nextValues.isSelected;
    }

    if (previousValues.syncEnabled !== nextValues.syncEnabled) {
        updateInput.syncEnabled = nextValues.syncEnabled;
    }

    if (previousValues.syncIntervalMinutes !== nextValues.syncIntervalMinutes) {
        updateInput.syncIntervalMinutes = nextValues.syncIntervalMinutes;
    }

    if (previousValues.reminderEnabled !== nextValues.reminderEnabled) {
        updateInput.reminderEnabled = nextValues.reminderEnabled;
        updateInput.reminderChannel = 'in_app';
    }

    if (previousValues.reminderLeadMinutes !== nextValues.reminderLeadMinutes) {
        updateInput.reminderLeadMinutes = nextValues.reminderLeadMinutes;
        updateInput.reminderChannel = 'in_app';
    }

    if (previousValues.calendarColorType !== nextValues.calendarColorType) {
        updateInput.calendarColorType = nextValues.calendarColorType;
    }

    const normalizedNextColor = normalizeGoogleCalendarColor(nextValues.colorOverride);
    const normalizedPreviousColor = normalizeGoogleCalendarColor(previousValues.colorOverride);

    if (normalizedPreviousColor !== normalizedNextColor) {
        updateInput.colorOverride = normalizedNextColor;
    }

    return Object.keys(updateInput).length > 1 ? updateInput : null;
}

function serializeCalendarFormValues(values: CalendarFormValues) {
    return JSON.stringify(values);
}

function areCalendarFormValuesEqual(left: CalendarFormValues, right: CalendarFormValues) {
    return serializeCalendarFormValues(left) === serializeCalendarFormValues(right);
}

function getConnectionSyncBadgeLabel(connection: GoogleConnectionDetail) {
    if (connection.lastSyncAt) {
        const parsedLastSyncAt = parseISO(connection.lastSyncAt);

        if (isValid(parsedLastSyncAt)) {
            return `Synced ${formatDistanceToNowStrict(parsedLastSyncAt, { addSuffix: true })}`;
        }
    }

    if (connection.lastSyncStatus === 'error') {
        return 'Sync error';
    }

    return 'Not synced';
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
