import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppShellActions } from '@/features/app-shell/app-shell-layout';
import {
    todayEvents,
    todayReminders,
    todaySummary,
    todayTasks,
} from '@/features/app-shell/mock-data';
import { CALENDAR_VIEWS, type CalendarView } from '@/shared/contracts/settings';
import { useAppShellStore } from '@/stores/app-shell-store';

export const Route = createFileRoute('/')({
    component: HomePage,
});

const calendarViewLabels: Record<CalendarView, string> = {
    day: 'Day',
    month: 'Month',
    week: 'Week',
};

function HomePage() {
    const navigate = useNavigate();
    const { openQuickAdd } = useAppShellActions();
    const { activeCalendarView, setActiveCalendarView } = useAppShellStore(
        useShallow((state) => ({
            activeCalendarView: state.activeCalendarView,
            setActiveCalendarView: state.setActiveCalendarView,
        })),
    );

    return (
        <section className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
                <div className='flex max-w-3xl flex-col gap-3'>
                    <p className='text-sm text-muted-foreground'>{todaySummary.eyebrow}</p>
                    <div className='flex flex-col gap-2'>
                        <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                            Today
                        </h2>
                        <p className='max-w-2xl text-base leading-7'>{todaySummary.headline}</p>
                        <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                            {todaySummary.summary}
                        </p>
                    </div>
                </div>

                <div className='flex flex-col gap-3 xl:items-end'>
                    <ToggleGroup
                        aria-label='Today horizon'
                        value={activeCalendarView}
                        onValueChange={(value) => {
                            if (CALENDAR_VIEWS.includes(value as CalendarView)) {
                                setActiveCalendarView(value as CalendarView);
                            }
                        }}
                        variant='outline'>
                        {CALENDAR_VIEWS.map((value) => (
                            <ToggleGroupItem key={value} value={value}>
                                {calendarViewLabels[value]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <div className='flex flex-wrap gap-2'>
                        <Button onClick={() => openQuickAdd('task')}>Add task</Button>
                        <Button variant='outline' onClick={() => openQuickAdd('event')}>
                            Add event
                        </Button>
                        <Button
                            variant='ghost'
                            onClick={() => {
                                void navigate({ to: '/notes' });
                            }}>
                            Quick note
                        </Button>
                    </div>
                </div>
            </div>

            <div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
                <Card>
                    <CardHeader>
                        <CardTitle>Today&apos;s events</CardTitle>
                        <CardDescription>
                            Timeline view for the conversations already shaping the day.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-3'>
                        {todayEvents.map((event) => (
                            <button
                                key={event.id}
                                className='flex w-full flex-col gap-3 rounded-2xl border bg-background p-4 text-left transition-colors hover:bg-muted/60'
                                type='button'
                                onClick={() => {
                                    void navigate({ to: '/calendar' });
                                }}>
                                <div className='flex items-start justify-between gap-3'>
                                    <div>
                                        <p className='font-medium'>{event.title}</p>
                                        <p className='mt-1 text-sm text-muted-foreground'>
                                            {event.startTime} - {event.endTime}
                                        </p>
                                    </div>
                                    <Badge variant='secondary'>{event.source}</Badge>
                                </div>
                                <div className='flex items-center justify-between gap-3 text-sm'>
                                    <p className='text-muted-foreground'>{event.location}</p>
                                    <p className='text-muted-foreground'>{event.linkedTask}</p>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Today&apos;s tasks</CardTitle>
                        <CardDescription>
                            Tight checklist cards with due signals and linked context.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-3'>
                        {todayTasks.map((task) => (
                            <div key={task.id} className='rounded-2xl border bg-background p-4'>
                                <div className='flex flex-col gap-3'>
                                    <div className='flex items-start justify-between gap-3'>
                                        <div>
                                            <p className='font-medium'>{task.title}</p>
                                            <p className='mt-1 text-sm text-muted-foreground'>
                                                Due {task.dueLabel}
                                            </p>
                                        </div>
                                        <Badge variant='outline'>{task.priority}</Badge>
                                    </div>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        <Badge variant='secondary'>{task.status}</Badge>
                                        <Badge variant='outline'>{task.notionPage}</Badge>
                                        <Badge variant='outline'>{task.reminder}</Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming reminders</CardTitle>
                        <CardDescription>
                            Compact reminders that keep follow-ups visible before they turn into
                            context switches.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-3'>
                        {todayReminders.map((reminder) => (
                            <div
                                key={reminder.id}
                                className='flex flex-col gap-3 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between'>
                                <div>
                                    <p className='font-medium'>{reminder.title}</p>
                                    <p className='mt-1 text-sm text-muted-foreground'>
                                        {reminder.timeLabel}
                                    </p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Badge variant='secondary'>{reminder.source}</Badge>
                                    <Button
                                        variant='outline'
                                        onClick={() => {
                                            void navigate({ to: '/reminders' });
                                        }}>
                                        Open
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick actions</CardTitle>
                        <CardDescription>
                            Keep capture close so planning does not turn into navigation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='grid gap-3'>
                        <Button className='justify-between' onClick={() => openQuickAdd('task')}>
                            Add task
                            <span className='text-xs text-primary-foreground/80'>
                                {format(new Date(), 'p')}
                            </span>
                        </Button>
                        <Button
                            className='justify-between'
                            variant='outline'
                            onClick={() => openQuickAdd('event')}>
                            Add event
                            <span className='text-xs text-muted-foreground'>Schedule next</span>
                        </Button>
                        <Button
                            className='justify-between'
                            variant='ghost'
                            onClick={() => {
                                void navigate({ to: '/notes' });
                            }}>
                            Quick note
                            <span className='text-xs text-muted-foreground'>
                                Open Notion bridge
                            </span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
