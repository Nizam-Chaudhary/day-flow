import type { FormAsyncValidateOrFn, FormValidateOrFn } from '@tanstack/form-core';
import type { ReactFormExtendedApi } from '@tanstack/react-form';

import { useForm, useStore } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { CalendarFormValues } from '@/components/integrations/google-calendar-integration-page.lib';
import type {
    GoogleCalendarColorType,
    GoogleCalendarSummary,
    GoogleConnectionDetail,
} from '@/schemas/contracts/google-calendar';

import googleLogo from '@/assets/integration-logos/google-color.svg';
import {
    areCalendarFormValuesEqual,
    buildGoogleCalendarUpdateInput,
    getCalendarFormValues,
    normalizeReminderLeadMinutesList,
} from '@/components/integrations/google-calendar-integration-page.lib';
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
import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
} from '@/components/ui/multi-select';
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
const CALENDAR_ROW_LABEL_CLASS = 'w-44 shrink-0 text-sm font-medium';
const CALENDAR_ROW_CLASS = 'gap-3 has-[>[data-slot=field-content]]:items-center';
const CALENDAR_ROW_CONTENT_CLASS = 'min-w-0 flex-row items-center justify-end';

type CalendarAutosaveState = 'error' | 'idle' | 'saved' | 'saving';

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

function formatCalendarColorTypeLabel(colorType: GoogleCalendarColorType) {
    return colorType === 'curated' ? 'Curated' : 'Custom';
}

function CalendarColorOptionContent({ color, label }: { color: string; label: string }) {
    return (
        <div className='flex min-w-0 items-center gap-2'>
            <span
                aria-hidden='true'
                className='size-3 shrink-0 rounded-full border border-border/70'
                style={{ backgroundColor: color }}
            />
            <span className='truncate'>{label}</span>
        </div>
    );
}

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
    const initialValuesRef = useRef(getCalendarFormValues(calendar));
    const form = useForm({
        defaultValues: initialValuesRef.current,
    });
    const values = useStore(form.store, (state) => state.values);
    const persistedValuesRef = useRef(initialValuesRef.current);
    const queuedValuesRef = useRef<CalendarFormValues | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
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
                persistedValuesRef.current,
                nextValues,
                calendar.id,
            );

            if (!updateInput) {
                if (saveState !== 'error') {
                    setSaveState('idle');
                }

                return;
            }

            isSavingRef.current = true;
            clearSavedStateTimer();
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

                persistedValuesRef.current = canonicalValues;
                didSaveSucceed = true;

                setSavedState();
            } catch {
                setSaveState('error');
            } finally {
                isSavingRef.current = false;

                if (didSaveSucceed && queuedValuesRef.current) {
                    const queuedValues = queuedValuesRef.current;
                    queuedValuesRef.current = null;

                    if (!areCalendarFormValuesEqual(queuedValues, persistedValuesRef.current)) {
                        void dispatchSave(queuedValues);
                    }
                } else if (!didSaveSucceed) {
                    queuedValuesRef.current = null;
                }
            }
        },
        [calendar.id, saveState, updateCalendar],
    );

    const scheduleSave = useCallback(
        (nextValues: CalendarFormValues, immediate = false) => {
            const hasPendingChanges = !areCalendarFormValuesEqual(
                nextValues,
                persistedValuesRef.current,
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

    const flushAutosave = () => {
        scheduleSave(form.store.state.values, true);
    };

    const savePatchedValues = useCallback(
        (patch: Partial<CalendarFormValues>, immediate = false) => {
            const nextValues = {
                ...form.store.state.values,
                ...patch,
            };

            scheduleSave(nextValues, immediate);
        },
        [form, scheduleSave],
    );

    return (
        <Card
            className='overflow-hidden border border-border/70 bg-card/95 shadow-sm'
            data-testid={`calendar-card-${calendar.id}`}>
            <CardHeader className='gap-3 px-4 pt-2 pb-0 sm:px-5'>
                <CalendarCardHeader
                    calendar={calendar}
                    effectiveColor={effectiveColor}
                    form={form}
                    onSavePatchedValues={savePatchedValues}
                />
            </CardHeader>

            {isCalendarEnabled ? (
                <CardContent className='px-4 pt-2 pb-0 sm:px-5'>
                    <div className='pt-1 pb-3'>
                        <Separator data-testid={`calendar-card-header-separator-${calendar.id}`} />
                    </div>
                    <div className='flex flex-col gap-4 rounded-2xl bg-muted/20 px-3 pt-3 pb-0 sm:px-4'>
                        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]'>
                            <CalendarSyncSection
                                calendarId={calendar.id}
                                form={form}
                                onSavePatchedValues={savePatchedValues}
                            />
                            <Separator
                                aria-hidden='true'
                                className='hidden lg:block'
                                orientation='vertical'
                            />
                            <CalendarReminderSection
                                calendarId={calendar.id}
                                form={form}
                                onSavePatchedValues={savePatchedValues}
                            />
                        </div>

                        <Separator />

                        <CalendarColorSection
                            calendarId={calendar.id}
                            colorOptions={curatedColorOptions}
                            form={form}
                            onSavePatchedValues={savePatchedValues}
                            selectedCuratedColor={selectedCuratedColor}
                            onColorBlur={flushAutosave}
                        />
                    </div>
                </CardContent>
            ) : null}
        </Card>
    );
}

function CalendarCardHeader({
    calendar,
    effectiveColor,
    form,
    onSavePatchedValues,
}: {
    calendar: GoogleCalendarSummary;
    effectiveColor: string;
    form: CalendarFormApi;
    onSavePatchedValues: (patch: Partial<CalendarFormValues>, immediate?: boolean) => void;
}) {
    return (
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='min-w-0 flex-1'>
                <div className='flex min-w-0 items-center gap-3'>
                    <span
                        aria-hidden='true'
                        className='size-3.5 shrink-0 rounded-full border border-border/70 shadow-sm'
                        data-testid={`calendar-effective-color-${calendar.id}`}
                        style={{ backgroundColor: effectiveColor }}
                    />
                    <CardTitle className='truncate text-base'>{calendar.name}</CardTitle>
                </div>

                <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                    <Badge variant='secondary'>{calendar.type}</Badge>
                    <Badge variant='outline'>{calendar.accessRole}</Badge>
                    {calendar.isPrimary ? <Badge variant='outline'>Primary</Badge> : null}
                </div>
            </div>

            <form.Field name='isSelected'>
                {(field: CalendarFieldState<boolean>) => (
                    <Field className='w-auto shrink-0' orientation='horizontal'>
                        <Switch
                            aria-label={`Enable ${calendar.name}`}
                            checked={field.state.value}
                            id={`${calendar.id}-selected`}
                            onCheckedChange={(checked) => {
                                field.handleChange(checked);
                                onSavePatchedValues({ isSelected: checked }, true);
                            }}
                        />
                    </Field>
                )}
            </form.Field>
        </div>
    );
}

function CalendarSyncSection({
    calendarId,
    form,
    onSavePatchedValues,
}: {
    calendarId: string;
    form: CalendarFormApi;
    onSavePatchedValues: (patch: Partial<CalendarFormValues>, immediate?: boolean) => void;
}) {
    const isCalendarEnabled = useStore(form.store, (state) => state.values.isSelected);
    const isSyncEnabled = useStore(form.store, (state) => state.values.syncEnabled);

    return (
        <FieldGroup className='gap-3'>
            <form.Field name='syncEnabled'>
                {(field: CalendarFieldState<boolean>) => (
                    <Field className={CALENDAR_ROW_CLASS} orientation='horizontal'>
                        <FieldLabel
                            className={CALENDAR_ROW_LABEL_CLASS}
                            htmlFor={`${calendarId}-sync-enabled`}>
                            Sync
                        </FieldLabel>
                        <FieldContent className={CALENDAR_ROW_CONTENT_CLASS}>
                            <Switch
                                checked={field.state.value}
                                disabled={!isCalendarEnabled}
                                id={`${calendarId}-sync-enabled`}
                                onCheckedChange={(checked) => {
                                    field.handleChange(checked);
                                    onSavePatchedValues({ syncEnabled: checked }, true);
                                }}
                            />
                        </FieldContent>
                    </Field>
                )}
            </form.Field>

            <form.Field name='syncIntervalMinutes'>
                {(field: CalendarFieldState<CalendarFormValues['syncIntervalMinutes']>) => (
                    <Field className={CALENDAR_ROW_CLASS} orientation='horizontal'>
                        <FieldLabel
                            className={CALENDAR_ROW_LABEL_CLASS}
                            htmlFor={`${calendarId}-sync-interval`}>
                            Sync interval
                        </FieldLabel>
                        <FieldContent className={CALENDAR_ROW_CONTENT_CLASS}>
                            <Select
                                disabled={!isCalendarEnabled || !isSyncEnabled}
                                value={String(field.state.value)}
                                onValueChange={(value) => {
                                    const nextValue = Number(
                                        value,
                                    ) as CalendarFormValues['syncIntervalMinutes'];

                                    field.handleChange(nextValue);
                                    onSavePatchedValues({ syncIntervalMinutes: nextValue }, true);
                                }}>
                                <SelectTrigger
                                    className='h-9 w-40 max-w-full bg-background/70'
                                    id={`${calendarId}-sync-interval`}
                                    data-testid={`calendar-sync-interval-${calendarId}`}>
                                    <SelectValue>
                                        {formatSyncIntervalLabel(field.state.value)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {GOOGLE_SYNC_INTERVAL_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={String(option)}>
                                                {formatSyncIntervalLabel(option)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>
                )}
            </form.Field>
        </FieldGroup>
    );
}

function CalendarReminderSection({
    calendarId,
    form,
    onSavePatchedValues,
}: {
    calendarId: string;
    form: CalendarFormApi;
    onSavePatchedValues: (patch: Partial<CalendarFormValues>, immediate?: boolean) => void;
}) {
    const isCalendarEnabled = useStore(form.store, (state) => state.values.isSelected);
    const isReminderEnabled = useStore(form.store, (state) => state.values.reminderEnabled);

    return (
        <FieldGroup className='gap-3'>
            <form.Field name='reminderEnabled'>
                {(field: CalendarFieldState<boolean>) => (
                    <Field className={CALENDAR_ROW_CLASS} orientation='horizontal'>
                        <FieldLabel
                            className={CALENDAR_ROW_LABEL_CLASS}
                            htmlFor={`${calendarId}-reminder-enabled`}>
                            Reminder
                        </FieldLabel>
                        <FieldContent className={CALENDAR_ROW_CONTENT_CLASS}>
                            <Switch
                                checked={field.state.value}
                                disabled={!isCalendarEnabled}
                                id={`${calendarId}-reminder-enabled`}
                                onCheckedChange={(checked) => {
                                    field.handleChange(checked);
                                    onSavePatchedValues({ reminderEnabled: checked }, true);
                                }}
                            />
                        </FieldContent>
                    </Field>
                )}
            </form.Field>

            <form.Field name='reminderLeadMinutesList'>
                {(field: CalendarFieldState<CalendarFormValues['reminderLeadMinutesList']>) => (
                    <Field className={CALENDAR_ROW_CLASS} orientation='horizontal'>
                        <FieldLabel
                            className={CALENDAR_ROW_LABEL_CLASS}
                            htmlFor={`${calendarId}-reminder-lead`}>
                            Default reminder time
                        </FieldLabel>
                        <FieldContent className={CALENDAR_ROW_CONTENT_CLASS}>
                            <ReminderLeadTimeMultiSelect
                                disabled={!isCalendarEnabled || !isReminderEnabled}
                                inputId={`${calendarId}-reminder-lead`}
                                value={field.state.value}
                                onValueChange={(nextValue) => {
                                    field.handleChange(nextValue);
                                    onSavePatchedValues(
                                        { reminderLeadMinutesList: nextValue },
                                        true,
                                    );
                                }}
                            />
                        </FieldContent>
                    </Field>
                )}
            </form.Field>
        </FieldGroup>
    );
}

function CalendarColorSection({
    calendarId,
    colorOptions,
    form,
    onSavePatchedValues,
    onColorBlur,
    selectedCuratedColor,
}: {
    calendarId: string;
    colorOptions: ReturnType<typeof getGoogleCalendarColorOptions>;
    form: CalendarFormApi;
    onSavePatchedValues: (patch: Partial<CalendarFormValues>, immediate?: boolean) => void;
    onColorBlur: () => void;
    selectedCuratedColor: string;
}) {
    const calendarColorType = useStore(form.store, (state) => state.values.calendarColorType);

    return (
        <div className='grid gap-4 lg:grid-cols-[minmax(0,188px)_minmax(0,1fr)]'>
            <form.Field name='calendarColorType'>
                {(field: CalendarFieldState<CalendarFormValues['calendarColorType']>) => (
                    <Field className='gap-2' orientation='vertical'>
                        <FieldLabel htmlFor={`${calendarId}-color-type`}>Color source</FieldLabel>
                        <FieldContent>
                            <Select
                                value={field.state.value}
                                onValueChange={(value) => {
                                    const nextValue =
                                        value as CalendarFormValues['calendarColorType'];

                                    field.handleChange(nextValue);

                                    if (nextValue === 'curated') {
                                        form.setFieldValue('colorOverride', selectedCuratedColor);
                                        onSavePatchedValues(
                                            {
                                                calendarColorType: 'curated',
                                                colorOverride: selectedCuratedColor,
                                            },
                                            true,
                                        );
                                        return;
                                    }

                                    onSavePatchedValues({ calendarColorType: 'custom' }, true);
                                }}>
                                <SelectTrigger
                                    className='h-9 w-full bg-background/70'
                                    id={`${calendarId}-color-type`}
                                    aria-label='Color source'>
                                    <SelectValue>
                                        {formatCalendarColorTypeLabel(field.state.value)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value='curated'>Curated</SelectItem>
                                        <SelectItem value='custom'>Custom</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>
                )}
            </form.Field>

            <div className='flex flex-col gap-3'>
                {calendarColorType === 'curated' ? (
                    <form.Field name='colorOverride'>
                        {(field: CalendarFieldState<string>) => (
                            <Field orientation='vertical'>
                                <FieldLabel htmlFor={`${calendarId}-curated-color`}>
                                    Color value
                                </FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={selectedCuratedColor}
                                        onValueChange={(value) => {
                                            const nextValue = normalizeGoogleCalendarColor(value);

                                            field.handleChange(nextValue);
                                            onSavePatchedValues({ colorOverride: nextValue }, true);
                                        }}>
                                        <SelectTrigger
                                            className='h-9 w-full bg-background/70'
                                            id={`${calendarId}-curated-color`}
                                            data-testid={`calendar-curated-color-${calendarId}`}>
                                            <SelectValue className='min-w-0'>
                                                <CalendarColorOptionContent
                                                    color={selectedCuratedColor}
                                                    label={
                                                        findGoogleCalendarCuratedColor(
                                                            selectedCuratedColor,
                                                        )?.label ?? 'Selected'
                                                    }
                                                />
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {colorOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.id}
                                                        value={option.value}>
                                                        <CalendarColorOptionContent
                                                            color={option.value}
                                                            label={option.label}
                                                        />
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
                            <FieldGroup className='grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)]'>
                                <Field orientation='vertical'>
                                    <FieldLabel htmlFor={`${calendarId}-color-picker`}>
                                        Picker
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            className='h-9 w-full rounded-xl bg-background/70 p-1'
                                            id={`${calendarId}-color-picker`}
                                            type='color'
                                            value={normalizeGoogleCalendarColor(field.state.value)}
                                            onBlur={() => {
                                                field.handleBlur();
                                                onColorBlur();
                                            }}
                                            onChange={(event) => {
                                                const nextValue = normalizeGoogleCalendarColor(
                                                    event.currentTarget.value,
                                                );

                                                field.handleChange(nextValue);
                                                onSavePatchedValues({ colorOverride: nextValue });
                                            }}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field orientation='vertical'>
                                    <FieldLabel htmlFor={`${calendarId}-color-hex`}>
                                        Color value
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            className='bg-background/70'
                                            id={`${calendarId}-color-hex`}
                                            value={field.state.value}
                                            onBlur={(event) => {
                                                const nextValue = normalizeGoogleCalendarColor(
                                                    event.currentTarget.value,
                                                );

                                                field.handleChange(nextValue);
                                                field.handleBlur();
                                                onSavePatchedValues({ colorOverride: nextValue });
                                                onColorBlur();
                                            }}
                                            onChange={(event) => {
                                                const nextValue = event.currentTarget.value;

                                                field.handleChange(nextValue);
                                                onSavePatchedValues({ colorOverride: nextValue });
                                            }}
                                        />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        )}
                    </form.Field>
                )}
            </div>
        </div>
    );
}

function ReminderLeadTimeMultiSelect({
    disabled,
    inputId,
    onValueChange,
    value,
}: {
    disabled: boolean;
    inputId: string;
    onValueChange: (value: GoogleCalendarSummary['reminderLeadMinutesList']) => void;
    value: GoogleCalendarSummary['reminderLeadMinutesList'];
}) {
    const normalizedValue = normalizeReminderLeadMinutesList(value);
    const selectedValues = normalizedValue.map(String);

    return (
        <MultiSelect
            values={selectedValues}
            onValuesChange={(nextValue) => {
                if (disabled) {
                    return;
                }

                const normalizedNextValue = normalizeReminderLeadMinutesList(
                    nextValue
                        .map((entry) => Number(entry))
                        .filter((entry) =>
                            GOOGLE_REMINDER_LEAD_OPTIONS.includes(
                                entry as (typeof GOOGLE_REMINDER_LEAD_OPTIONS)[number],
                            ),
                        ) as GoogleCalendarSummary['reminderLeadMinutesList'],
                );

                if (normalizedNextValue.length === 0) {
                    return;
                }

                onValueChange(normalizedNextValue);
            }}>
            <MultiSelectTrigger
                aria-label='Default reminder time'
                className='h-9 max-h-9 min-h-9 w-48 max-w-full bg-background/70 px-3 py-0'
                disabled={disabled}
                id={inputId}>
                <span className='min-w-0 flex-1 overflow-hidden text-left text-sm text-ellipsis whitespace-nowrap'>
                    {formatReminderLeadSummary(normalizedValue)}
                </span>
            </MultiSelectTrigger>
            <MultiSelectContent search={false}>
                <MultiSelectGroup>
                    {GOOGLE_REMINDER_LEAD_OPTIONS.map((option) => (
                        <MultiSelectItem key={option} value={String(option)}>
                            {formatReminderLeadLabel(option)}
                        </MultiSelectItem>
                    ))}
                </MultiSelectGroup>
            </MultiSelectContent>
        </MultiSelect>
    );
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

function formatSyncIntervalLabel(value: GoogleCalendarSummary['syncIntervalMinutes']) {
    if (value >= 60 && value % 60 === 0) {
        const hours = value / 60;

        return `${hours} hr`;
    }

    return `${value} min`;
}

function formatReminderLeadLabel(value: GoogleCalendarSummary['reminderLeadMinutesList'][number]) {
    if (value === 0) {
        return 'At time of event';
    }

    if (value >= 60 && value % 60 === 0) {
        return `${value / 60} hr before`;
    }

    return `${value} min before`;
}

function formatReminderLeadSummary(value: GoogleCalendarSummary['reminderLeadMinutesList']) {
    return normalizeReminderLeadMinutesList(value).map(formatReminderLeadLabel).join(', ');
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
