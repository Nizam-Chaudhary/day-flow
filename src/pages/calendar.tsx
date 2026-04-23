import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { addDays, format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';

import { useAppShellActions } from '@/components/app-shell/app-shell-actions';
import {
    type CalendarUiEvent,
    formatCalendarEventTimeLabel,
    getCalendarEventDateLabel,
    mapGoogleCalendarEventToCalendarUiEvent,
    splitCalendarUiEvents,
} from '@/components/calendar/calendar-events';
import { MonthPlannerSurface } from '@/components/calendar/month-planner-surface';
import { PlannerSurface } from '@/components/calendar/planner-surface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useVisibleDayCount } from '@/hooks/use-visible-day-count';
import { isCalendarView, type CalendarView } from '@/schemas/contracts/settings';
import { googleCalendarEventsQueryOptions } from '@/services/google-calendar';
import { useAppShellStore } from '@/stores/app-shell-store';
import { buildBufferedDayRange, getIsoDate, type PlannerMode } from '@/utils/planner-utils';

export const Route = createFileRoute('/calendar')({
    component: CalendarPage,
});

const calendarModeLabels: Record<CalendarView | 'agenda', string> = {
    agenda: 'Agenda',
    day: 'Day',
    month: 'Month',
    week: 'Week',
};

export function CalendarPage() {
    const appShellActions = useAppShellActions();
    const [isTodayEventsSheetOpen, setIsTodayEventsSheetOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarUiEvent | null>(null);
    const activeCalendarView = useAppShellStore((state) => state.activeCalendarView);
    const selectedDate = useAppShellStore((state) => state.selectedDate);
    const plannerMode = (activeCalendarView === 'day' ? 'day' : 'week') satisfies PlannerMode;
    const { containerRef, visibleDayCount } = useVisibleDayCount(plannerMode);
    const bufferedDates = useMemo(
        () =>
            buildBufferedDayRange(
                selectedDate,
                activeCalendarView === 'month' ? 1 : visibleDayCount,
            ),
        [activeCalendarView, selectedDate, visibleDayCount],
    );
    const bufferedRange = useMemo(
        () => ({
            rangeEnd: getIsoDate(addDays(bufferedDates[bufferedDates.length - 1]!, 1)),
            rangeStart: getIsoDate(bufferedDates[0]!),
        }),
        [bufferedDates],
    );
    const todayIsoDate = format(new Date(), 'yyyy-MM-dd');
    const todayRange = useMemo(
        () => ({
            rangeEnd: format(addDays(parseISO(todayIsoDate), 1), 'yyyy-MM-dd'),
            rangeStart: todayIsoDate,
        }),
        [todayIsoDate],
    );
    const eventsQuery = useQuery({
        ...googleCalendarEventsQueryOptions(bufferedRange),
        enabled: activeCalendarView !== 'month',
    });
    const todayEventsQuery = useQuery(googleCalendarEventsQueryOptions(todayRange));
    const plannerEvents = useMemo(
        () =>
            splitCalendarUiEvents(
                (eventsQuery.data ?? []).map(mapGoogleCalendarEventToCalendarUiEvent),
            ).timedEvents,
        [eventsQuery.data],
    );
    const todayEvents = useMemo(
        () => (todayEventsQuery.data ?? []).map(mapGoogleCalendarEventToCalendarUiEvent),
        [todayEventsQuery.data],
    );

    return (
        <section ref={containerRef} className='flex max-w-full min-w-0 flex-col gap-6'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
                <div className='flex max-w-3xl min-w-0 flex-1 basis-80 flex-col gap-2'>
                    <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                        Calendar
                    </h2>
                    <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                        Timed events stay in the planner. Today&apos;s synced events are available
                        in a minimal sheet from the header.
                    </p>
                </div>

                <div
                    className='flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:items-start lg:items-end'
                    data-testid='calendar-page-controls'>
                    <ToggleGroup
                        aria-label='Calendar view'
                        className='w-full flex-wrap justify-start sm:w-auto lg:justify-end'
                        data-testid='calendar-view-toggle'
                        value={[activeCalendarView]}
                        variant='outline'
                        onValueChange={(groupValue) => {
                            const [nextMode] = groupValue;

                            if (nextMode && isCalendarView(nextMode)) {
                                useAppShellStore.getState().setActiveCalendarView(nextMode);
                            }
                        }}>
                        {(['day', 'week', 'month', 'agenda'] as const).map((value) => (
                            <ToggleGroupItem
                                key={value}
                                disabled={value === 'agenda'}
                                value={value}>
                                {calendarModeLabels[value]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
                        <Button
                            className='w-full sm:w-auto'
                            variant='outline'
                            onClick={() => setIsTodayEventsSheetOpen(true)}>
                            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
                            Today events
                            {todayEvents.length > 0 ? ` (${todayEvents.length})` : ''}
                        </Button>
                        <Button
                            className='w-full sm:w-auto'
                            onClick={() => appShellActions.openQuickAdd('event')}>
                            Add event
                        </Button>
                    </div>
                </div>
            </div>

            {activeCalendarView === 'month' ? (
                <MonthPlannerSurface
                    anchorDate={selectedDate}
                    onSelectDate={(date) => {
                        useAppShellStore.getState().setSelectedDate(date);
                    }}
                />
            ) : eventsQuery.isError ? (
                <CalendarMessageCard
                    description='Google events could not be loaded for the planner range.'
                    title='Calendar unavailable'
                />
            ) : eventsQuery.isPending ? (
                <CalendarMessageCard
                    description='Loading synced Google events into the planner.'
                    title='Loading events'
                />
            ) : (
                <PlannerSurface
                    anchorDate={selectedDate}
                    events={plannerEvents}
                    mode={plannerMode}
                    onOpenEvent={(event) => {
                        setSelectedEvent(event);
                    }}
                    onSelectDate={(date) => {
                        useAppShellStore.getState().setSelectedDate(date);
                    }}
                />
            )}

            <Sheet open={isTodayEventsSheetOpen} onOpenChange={setIsTodayEventsSheetOpen}>
                <SheetContent side='right'>
                    <SheetHeader>
                        <SheetTitle>Today&apos;s events</SheetTitle>
                        <SheetDescription>
                            {format(parseISO(todayIsoDate), 'EEEE, d MMMM')}
                        </SheetDescription>
                    </SheetHeader>
                    <div className='flex flex-1 flex-col gap-3 px-6 pb-6'>
                        {todayEventsQuery.isError ? (
                            <p className='text-sm text-muted-foreground'>
                                Today&apos;s events could not be loaded.
                            </p>
                        ) : todayEventsQuery.isPending ? (
                            <p className='text-sm text-muted-foreground'>
                                Loading today&apos;s events.
                            </p>
                        ) : todayEvents.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>
                                No synced Google events for today.
                            </p>
                        ) : (
                            todayEvents.map((event) => (
                                <button
                                    key={event.id}
                                    className='rounded-2xl border p-0 text-left transition-opacity hover:opacity-90'
                                    type='button'
                                    onClick={() => {
                                        setIsTodayEventsSheetOpen(false);
                                        setSelectedEvent(event);
                                    }}>
                                    <Card
                                        className='border-0 shadow-none'
                                        size='sm'
                                        style={{
                                            borderLeftColor: event.calendarColor,
                                            borderLeftWidth: '4px',
                                        }}>
                                        <CardHeader>
                                            <CardTitle className='text-sm'>{event.title}</CardTitle>
                                            <CardDescription>
                                                {formatCalendarEventTimeLabel(event)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className='pt-0'>
                                            <p className='text-sm font-medium'>
                                                {event.calendarName}
                                            </p>
                                            <p className='mt-1 text-xs text-muted-foreground'>
                                                {getCalendarEventDateLabel(event)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </button>
                            ))
                        )}
                    </div>
                    <SheetFooter>
                        <Button variant='outline' onClick={() => setIsTodayEventsSheetOpen(false)}>
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Sheet
                open={selectedEvent !== null}
                onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <SheetContent side='right'>
                    <SheetHeader>
                        <SheetTitle>{selectedEvent?.title}</SheetTitle>
                        <SheetDescription>
                            {selectedEvent ? getCalendarEventDateLabel(selectedEvent) : null}
                        </SheetDescription>
                    </SheetHeader>
                    {selectedEvent ? (
                        <div className='flex flex-1 flex-col gap-6 px-6 pb-6'>
                            <div
                                className='rounded-2xl border px-4 py-3'
                                style={{
                                    borderLeftColor: selectedEvent.calendarColor,
                                    borderLeftWidth: '4px',
                                }}>
                                <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase'>
                                    Calendar
                                </p>
                                <p className='mt-2 text-sm font-medium'>
                                    {selectedEvent.calendarName}
                                </p>
                            </div>
                            <div className='grid gap-4'>
                                <DetailRow
                                    label='Time'
                                    value={formatCalendarEventTimeLabel(selectedEvent)}
                                />
                                <DetailRow
                                    label='Location'
                                    value={selectedEvent.location ?? 'Not set'}
                                />
                                <DetailRow
                                    label='Description'
                                    value={selectedEvent.description ?? 'No description'}
                                />
                            </div>
                        </div>
                    ) : null}
                    <SheetFooter>
                        <Button variant='outline' onClick={() => setSelectedEvent(null)}>
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </section>
    );
}

function CalendarMessageCard({ description, title }: { description: string; title: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
        </Card>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className='rounded-2xl border bg-background px-4 py-3'>
            <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase'>{label}</p>
            <p className='mt-2 text-sm font-medium'>{value}</p>
        </div>
    );
}
