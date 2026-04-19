import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
import { useAppShellActions } from '@/features/app-shell/app-shell-layout';
import { mockEvents, type MockEvent } from '@/features/app-shell/mock-data';
import { MonthPlannerSurface } from '@/features/calendar/month-planner-surface';
import { PlannerSurface } from '@/features/calendar/planner-surface';
import { isCalendarView, type CalendarView } from '@/shared/contracts/settings';
import { useAppShellStore } from '@/stores/app-shell-store';

export const Route = createFileRoute('/calendar')({
    component: CalendarPage,
});

type CalendarMode = CalendarView | 'agenda';

const calendarModeLabels: Record<CalendarMode, string> = {
    agenda: 'Agenda',
    day: 'Day',
    month: 'Month',
    week: 'Week',
};

function CalendarPage() {
    const appShellActions = useAppShellActions();
    const [isAgendaView, setIsAgendaView] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);
    const hasInitializedSelectedDate = useRef(false);
    const activeCalendarView = useAppShellStore((state) => state.activeCalendarView);
    const selectedDate = useAppShellStore((state) => state.selectedDate);

    const activeMode: CalendarMode = isAgendaView ? 'agenda' : activeCalendarView;

    useEffect(() => {
        if (hasInitializedSelectedDate.current) {
            return;
        }

        hasInitializedSelectedDate.current = true;

        if (mockEvents.some((event) => event.date === selectedDate)) {
            return;
        }

        useAppShellStore.getState().setSelectedDate(mockEvents[0].date);
    }, [selectedDate]);

    return (
        <section className='flex max-w-full min-w-0 flex-col gap-6'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
                <div className='flex max-w-3xl min-w-0 flex-1 basis-80 flex-col gap-2'>
                    <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                        Calendar
                    </h2>
                    <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                        View day, week, month, or agenda layouts without changing the underlying
                        shell contracts.
                    </p>
                </div>

                <div
                    className='flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:items-start lg:items-end'
                    data-testid='calendar-page-controls'>
                    <ToggleGroup
                        aria-label='Calendar view'
                        className='w-full flex-wrap justify-start sm:w-auto lg:justify-end'
                        data-testid='calendar-view-toggle'
                        value={[activeMode]}
                        variant='outline'
                        onValueChange={(groupValue) => {
                            const [nextMode] = groupValue;

                            if (!nextMode) {
                                return;
                            }

                            if (nextMode === 'agenda') {
                                setIsAgendaView(true);
                                return;
                            }

                            if (isCalendarView(nextMode)) {
                                setIsAgendaView(false);
                                useAppShellStore.getState().setActiveCalendarView(nextMode);
                            }
                        }}>
                        {(['day', 'week', 'month', 'agenda'] as const).map((value) => (
                            <ToggleGroupItem key={value} value={value}>
                                {calendarModeLabels[value]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <Button
                        className='w-full sm:w-auto'
                        onClick={() => appShellActions.openQuickAdd('event')}>
                        Add event
                    </Button>
                </div>
            </div>

            {activeMode === 'agenda' ? (
                <Card className='overflow-hidden'>
                    <CardHeader>
                        <CardTitle>Planner surface</CardTitle>
                        <CardDescription>
                            Mock unified events with source badges and a consistent right-side
                            detail sheet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex flex-col gap-3'>
                            {mockEvents.map((event) => (
                                <button
                                    key={event.id}
                                    aria-label={`Open event ${event.title}`}
                                    className='flex w-full flex-col gap-3 rounded-2xl border bg-background p-4 text-left transition-colors hover:bg-muted/60'
                                    type='button'
                                    onClick={() => {
                                        setSelectedEvent(event);
                                    }}>
                                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                        <div>
                                            <p className='font-medium'>{event.title}</p>
                                            <p className='mt-1 text-sm text-muted-foreground'>
                                                {event.date} · {event.startTime} - {event.endTime}
                                            </p>
                                        </div>
                                        <Badge variant='secondary'>{event.source}</Badge>
                                    </div>
                                    <p className='text-sm leading-6 text-muted-foreground'>
                                        {event.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : activeMode === 'month' ? (
                <MonthPlannerSurface
                    anchorDate={selectedDate}
                    onSelectDate={(date) => {
                        useAppShellStore.getState().setSelectedDate(date);
                    }}
                />
            ) : (
                <PlannerSurface
                    anchorDate={selectedDate}
                    events={mockEvents}
                    mode={activeMode}
                    onOpenEvent={(event) => {
                        setSelectedEvent(event);
                    }}
                    onSelectDate={(date) => {
                        useAppShellStore.getState().setSelectedDate(date);
                    }}
                />
            )}

            <Sheet
                open={selectedEvent !== null}
                onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <SheetContent side='right'>
                    <SheetHeader>
                        <SheetTitle>{selectedEvent?.title}</SheetTitle>
                        <SheetDescription>
                            {selectedEvent?.date} · {selectedEvent?.startTime} -{' '}
                            {selectedEvent?.endTime}
                        </SheetDescription>
                    </SheetHeader>
                    {selectedEvent ? (
                        <div className='flex flex-1 flex-col gap-6 px-6 pb-6'>
                            <div className='grid gap-4'>
                                <DetailRow label='Source' value={selectedEvent.source} />
                                <DetailRow label='Calendar' value={selectedEvent.calendar} />
                                <DetailRow label='Location' value={selectedEvent.location} />
                            </div>
                            <Card size='sm'>
                                <CardHeader>
                                    <CardTitle className='text-sm'>Linked context</CardTitle>
                                    <CardDescription>
                                        Keep task and note references visible from the event detail
                                        surface.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='grid gap-3'>
                                    <DetailRow
                                        label='Linked task'
                                        value={selectedEvent.linkedTask}
                                    />
                                    <DetailRow
                                        label='Notion area'
                                        value={selectedEvent.linkedNote}
                                    />
                                </CardContent>
                            </Card>
                            <Card size='sm'>
                                <CardHeader>
                                    <CardTitle className='text-sm'>Reminder</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className='text-sm text-muted-foreground'>
                                        {selectedEvent.reminder}
                                    </p>
                                </CardContent>
                            </Card>
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

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className='rounded-2xl border bg-background px-4 py-3'>
            <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase'>{label}</p>
            <p className='mt-2 text-sm font-medium'>{value}</p>
        </div>
    );
}
