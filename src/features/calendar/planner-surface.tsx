import { addDays, format, parseISO } from 'date-fns';
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

import type { MockEvent } from '@/features/app-shell/mock-data';

import { Button } from '@/components/ui/button';
import {
    buildDayRange,
    buildWeekRange,
    CALENDAR_CELL_SIZE,
    CALENDAR_TIME_GUTTER,
    formatHourLabel,
    formatPlannerRangeLabel,
    getDateHeaderLabel,
    getDateHeaderSubLabel,
    getEventDurationMinutes,
    getIsoDate,
    getVisibleWeekSlice,
    parseTimeToMinutes,
    type PlannerMode,
} from '@/features/calendar/planner-utils';
import { useVisibleDayCount } from '@/features/calendar/use-visible-day-count';
import { cn } from '@/lib/utils';

interface PlannerSurfaceProps {
    anchorDate: string;
    events: MockEvent[];
    mode: PlannerMode;
    onOpenEvent(this: void, event: MockEvent): void;
    onSelectDate(this: void, date: string): void;
    weekStartsOn: 0 | 1;
}

const hourRows = Array.from({ length: 24 }, (_, hour) => hour);

export function PlannerSurface({
    anchorDate,
    events,
    mode,
    onOpenEvent,
    onSelectDate,
    weekStartsOn,
}: PlannerSurfaceProps) {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const { containerRef, visibleDayCount } = useVisibleDayCount(mode);

    const weekDates = useMemo(
        () => buildWeekRange(anchorDate, weekStartsOn),
        [anchorDate, weekStartsOn],
    );
    const visibleWeekSlice = useMemo(
        () => getVisibleWeekSlice(weekDates, anchorDate, visibleDayCount),
        [anchorDate, visibleDayCount, weekDates],
    );
    const renderedDates = useMemo(
        () => (mode === 'day' ? buildDayRange(anchorDate, visibleDayCount) : weekDates),
        [anchorDate, mode, visibleDayCount, weekDates],
    );
    const rangeDates = useMemo(
        () =>
            mode === 'day'
                ? renderedDates
                : weekDates.slice(visibleWeekSlice.startIndex, visibleWeekSlice.endIndex + 1),
        [mode, renderedDates, visibleWeekSlice.endIndex, visibleWeekSlice.startIndex, weekDates],
    );

    useEffect(() => {
        if (!scrollAreaRef.current || mode !== 'week') {
            return;
        }

        const startDate = weekDates[visibleWeekSlice.startIndex];
        const target = scrollAreaRef.current.querySelector<HTMLElement>(
            `[data-date-column="${getIsoDate(startDate)}"]`,
        );

        target?.scrollIntoView({
            block: 'nearest',
            inline: 'start',
        });
    }, [mode, visibleWeekSlice.startIndex, weekDates]);

    const eventsByDate = useMemo(() => {
        const dateMap = new Map<string, MockEvent[]>();

        renderedDates.forEach((date) => {
            dateMap.set(getIsoDate(date), []);
        });

        events.forEach((event) => {
            if (!dateMap.has(event.date)) {
                return;
            }

            dateMap.get(event.date)?.push(event);
        });

        dateMap.forEach((dateEvents) => {
            dateEvents.sort(
                (leftEvent, rightEvent) =>
                    parseTimeToMinutes(leftEvent.startTime) -
                    parseTimeToMinutes(rightEvent.startTime),
            );
        });

        return dateMap;
    }, [events, renderedDates]);

    const rangeLabel = formatPlannerRangeLabel(rangeDates);
    const helperLabel = `${visibleDayCount} ${visibleDayCount === 1 ? 'day' : 'days'} visible`;
    const gridTemplateColumns = `var(--calendar-time-gutter) repeat(${renderedDates.length}, minmax(var(--calendar-cell-size), 1fr))`;

    return (
        <section className='flex flex-col gap-4' data-testid='planner-surface' ref={containerRef}>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                    <Button
                        aria-label='Previous dates'
                        size='icon-sm'
                        variant='outline'
                        onClick={() =>
                            onSelectDate(
                                format(
                                    addDays(parseISO(anchorDate), -visibleDayCount),
                                    'yyyy-MM-dd',
                                ),
                            )
                        }>
                        <span aria-hidden='true' className='text-sm'>
                            ←
                        </span>
                    </Button>
                    <Button
                        aria-label='Next dates'
                        size='icon-sm'
                        variant='outline'
                        onClick={() =>
                            onSelectDate(
                                format(
                                    addDays(parseISO(anchorDate), visibleDayCount),
                                    'yyyy-MM-dd',
                                ),
                            )
                        }>
                        <span aria-hidden='true' className='text-sm'>
                            →
                        </span>
                    </Button>
                </div>

                <div className='min-w-0 sm:text-right'>
                    <p className='text-sm font-medium tracking-tight'>{rangeLabel}</p>
                    <p className='text-xs text-muted-foreground'>{helperLabel}</p>
                </div>
            </div>

            <div className='overflow-hidden border bg-background'>
                <div
                    className='max-h-[calc(100vh-19rem)] min-h-[30rem] overflow-auto overscroll-contain'
                    ref={scrollAreaRef}>
                    <div
                        className='relative min-w-full'
                        style={
                            {
                                '--calendar-cell-size': `${CALENDAR_CELL_SIZE}px`,
                                '--calendar-time-gutter': `${CALENDAR_TIME_GUTTER}px`,
                                minWidth: `${CALENDAR_TIME_GUTTER + renderedDates.length * CALENDAR_CELL_SIZE}px`,
                            } as CSSProperties
                        }>
                        <div
                            className='sticky top-0 z-30 grid bg-background'
                            style={{ gridTemplateColumns }}>
                            <div className='sticky left-0 z-40 h-16 border-r border-b bg-background' />
                            {renderedDates.map((date) => {
                                const isoDate = getIsoDate(date);
                                const isActive = isoDate === anchorDate;

                                return (
                                    <button
                                        key={isoDate}
                                        className={cn(
                                            'flex h-16 min-w-[var(--calendar-cell-size)] flex-col items-start justify-center border-r border-b bg-background px-4 text-left transition-colors hover:bg-muted/50',
                                            isActive && 'bg-muted/50',
                                        )}
                                        data-date-column={isoDate}
                                        type='button'
                                        onClick={() => onSelectDate(isoDate)}>
                                        <span className='text-sm font-medium tracking-tight'>
                                            {getDateHeaderLabel(date)}
                                        </span>
                                        <span className='text-xs text-muted-foreground'>
                                            {getDateHeaderSubLabel(date)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className='relative grid bg-background'
                            style={{ gridTemplateColumns }}>
                            {hourRows.map((hour) => (
                                <FragmentRow hour={hour} key={hour} renderedDates={renderedDates} />
                            ))}

                            <div
                                className='pointer-events-none absolute inset-y-0 right-0 left-[var(--calendar-time-gutter)] grid'
                                style={{
                                    gridTemplateColumns: `repeat(${renderedDates.length}, minmax(var(--calendar-cell-size), 1fr))`,
                                }}>
                                {renderedDates.map((date) => {
                                    const isoDate = getIsoDate(date);
                                    const dateEvents = eventsByDate.get(isoDate) ?? [];

                                    return (
                                        <div
                                            key={isoDate}
                                            className='relative border-r last:border-r-0'>
                                            {dateEvents.map((event) => {
                                                const topOffset =
                                                    (parseTimeToMinutes(event.startTime) / 60) *
                                                    CALENDAR_CELL_SIZE;
                                                const height =
                                                    (getEventDurationMinutes(event) / 60) *
                                                    CALENDAR_CELL_SIZE;

                                                return (
                                                    <button
                                                        key={event.id}
                                                        aria-label={`Open event ${event.title}`}
                                                        className='pointer-events-auto absolute inset-x-1.5 overflow-hidden rounded-sm border bg-primary/10 px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-primary/14'
                                                        style={{
                                                            height: `${Math.max(height - 4, 28)}px`,
                                                            top: `${topOffset + 2}px`,
                                                        }}
                                                        type='button'
                                                        onClick={() => onOpenEvent(event)}>
                                                        <p className='truncate text-xs font-medium tracking-tight'>
                                                            {event.title}
                                                        </p>
                                                        <p className='mt-1 truncate text-[11px] text-muted-foreground'>
                                                            {event.startTime} - {event.endTime}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FragmentRow({ hour, renderedDates }: { hour: number; renderedDates: Date[] }) {
    return (
        <>
            <div className='sticky left-0 z-20 flex h-[var(--calendar-cell-size)] items-start justify-end border-r border-b bg-background px-3 py-2 text-xs text-muted-foreground'>
                {formatHourLabel(hour)}
            </div>
            {renderedDates.map((date) => (
                <div
                    key={`${getIsoDate(date)}-${hour}`}
                    className='h-[var(--calendar-cell-size)] min-w-[var(--calendar-cell-size)] border-r border-b bg-background'
                />
            ))}
        </>
    );
}
