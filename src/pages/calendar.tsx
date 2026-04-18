import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

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
import { calendarColumns, mockEvents, type MockEvent } from '@/features/app-shell/mock-data';
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
    const activeCalendarView = useAppShellStore((state) => state.activeCalendarView);

    const activeMode: CalendarMode = isAgendaView ? 'agenda' : activeCalendarView;

    return (
        <section className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
                <div className='flex max-w-3xl flex-col gap-2'>
                    <p className='text-sm text-muted-foreground'>Unified scheduling workspace</p>
                    <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                        Calendar
                    </h2>
                    <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                        View day, week, month, or agenda layouts without changing the underlying
                        shell contracts.
                    </p>
                </div>

                <div className='flex flex-col gap-3 xl:items-end'>
                    <ToggleGroup aria-label='Calendar view' variant='outline'>
                        {(['day', 'week', 'month', 'agenda'] as const).map((value) => (
                            <ToggleGroupItem
                                key={value}
                                value={value}
                                pressed={activeMode === value}
                                onPressedChange={(pressed) => {
                                    if (!pressed) {
                                        return;
                                    }

                                    if (value === 'agenda') {
                                        setIsAgendaView(true);
                                        return;
                                    }

                                    if (isCalendarView(value)) {
                                        setIsAgendaView(false);
                                        useAppShellStore.getState().setActiveCalendarView(value);
                                    }
                                }}>
                                {calendarModeLabels[value]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <Button onClick={() => appShellActions.openQuickAdd('event')}>Add event</Button>
                </div>
            </div>

            <Card className='overflow-hidden'>
                <CardHeader>
                    <CardTitle>Planner surface</CardTitle>
                    <CardDescription>
                        Mock unified events with source badges and a consistent right-side detail
                        sheet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeMode === 'agenda' ? (
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
                    ) : activeMode === 'month' ? (
                        <div className='grid gap-3 md:grid-cols-7'>
                            {calendarColumns.map((column) => {
                                const events = mockEvents.filter(
                                    (event) => event.date === column.date,
                                );

                                return (
                                    <div
                                        key={column.id}
                                        className='flex min-h-44 flex-col gap-3 rounded-2xl border bg-background p-3'>
                                        <div className='flex items-center justify-between'>
                                            <p className='font-medium'>{column.dayLabel}</p>
                                            <Badge variant='outline'>{column.numericDate}</Badge>
                                        </div>
                                        <div className='flex flex-col gap-2'>
                                            {events.length > 0 ? (
                                                events.map((event) => (
                                                    <button
                                                        key={event.id}
                                                        aria-label={`Open event ${event.title}`}
                                                        className='rounded-xl bg-muted/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted'
                                                        type='button'
                                                        onClick={() => {
                                                            setSelectedEvent(event);
                                                        }}>
                                                        <p className='truncate font-medium'>
                                                            {event.title}
                                                        </p>
                                                        <p className='mt-1 text-xs text-muted-foreground'>
                                                            {event.startTime}
                                                        </p>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className='text-sm text-muted-foreground'>
                                                    No events
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div
                            className={`grid gap-4 ${
                                activeMode === 'day' ? 'md:grid-cols-1' : 'md:grid-cols-7'
                            }`}>
                            {(activeMode === 'day'
                                ? calendarColumns
                                      .filter((column) =>
                                          mockEvents.some((event) => event.date === column.date),
                                      )
                                      .slice(0, 1)
                                : calendarColumns
                            ).map((column) => {
                                const events = mockEvents.filter(
                                    (event) => event.date === column.date,
                                );

                                return (
                                    <div
                                        key={column.id}
                                        className='flex min-h-80 flex-col rounded-2xl border bg-background'>
                                        <div className='border-b px-4 py-3'>
                                            <p className='font-medium'>{column.dayLabel}</p>
                                            <p className='text-sm text-muted-foreground'>
                                                {column.date}
                                            </p>
                                        </div>
                                        <div className='flex flex-1 flex-col gap-3 p-4'>
                                            {events.length > 0 ? (
                                                events.map((event) => (
                                                    <button
                                                        key={event.id}
                                                        aria-label={`Open event ${event.title}`}
                                                        className='flex flex-col gap-2 rounded-2xl border border-transparent bg-primary/8 px-3 py-3 text-left transition-colors hover:bg-primary/12'
                                                        type='button'
                                                        onClick={() => {
                                                            setSelectedEvent(event);
                                                        }}>
                                                        <div className='flex items-center justify-between gap-3'>
                                                            <p className='font-medium'>
                                                                {event.title}
                                                            </p>
                                                            <Badge variant='secondary'>
                                                                {event.source}
                                                            </Badge>
                                                        </div>
                                                        <p className='text-sm text-muted-foreground'>
                                                            {event.startTime} - {event.endTime}
                                                        </p>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className='flex flex-1 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground'>
                                                    No scheduled events
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

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
