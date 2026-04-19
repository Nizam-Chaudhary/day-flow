import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format, parseISO } from 'date-fns';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
    getCenteredScrollTopForMonthDate,
    getMonthGridDates,
    getMonthLabel,
    getMonthWeekdayLabels,
    getSystemTodayIsoDate,
    getIsoDate,
    isDateInMonth,
    isSameIsoDate,
    isWeekendDate,
    shiftIsoDateByMonths,
} from '@/features/calendar/planner-utils';
import { cn } from '@/lib/utils';

interface MonthPlannerSurfaceProps {
    anchorDate: string;
    onSelectDate(this: void, date: string): void;
}

const MONTH_SURFACE_HEIGHT_CLASS = 'max-h-[calc(100vh-19rem)] min-h-[30rem]';

export function MonthPlannerSurface({ anchorDate, onSelectDate }: MonthPlannerSurfaceProps) {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
    const hasAutoCenteredRef = useRef(false);
    const pendingCenterOnTodayRef = useRef(false);
    const todayIsoDate = getSystemTodayIsoDate();
    const monthLabel = getMonthLabel(anchorDate);
    const weekdayLabels = getMonthWeekdayLabels();
    const monthGridDates = getMonthGridDates(anchorDate);
    const todayButtonLabel = `Today ${format(parseISO(todayIsoDate), 'd MMM, yyyy')}`;
    const isTodayInMonth = isDateInMonth(parseISO(todayIsoDate), anchorDate);
    const todayWeekdayIndex = getMondayFirstWeekdayIndex(parseISO(todayIsoDate));

    useEffect(() => {
        const shouldCenter = !hasAutoCenteredRef.current || pendingCenterOnTodayRef.current;

        if (!shouldCenter) {
            return;
        }

        hasAutoCenteredRef.current = true;

        if (
            !isTodayInMonth ||
            !centerMonthDateInView(scrollAreaRef.current, stickyHeaderRef.current, todayIsoDate)
        ) {
            pendingCenterOnTodayRef.current = false;
            return;
        }

        pendingCenterOnTodayRef.current = false;
    }, [isTodayInMonth, todayIsoDate]);

    const handleSelectToday = () => {
        pendingCenterOnTodayRef.current = true;

        if (isTodayInMonth) {
            centerMonthDateInView(scrollAreaRef.current, stickyHeaderRef.current, todayIsoDate);
        }

        onSelectDate(todayIsoDate);
    };

    return (
        <section
            className='flex max-w-full min-w-0 flex-col gap-4'
            data-testid='month-planner-surface'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                    <Button
                        aria-label={todayButtonLabel}
                        variant='outline'
                        onClick={handleSelectToday}>
                        {todayButtonLabel}
                    </Button>
                    <Button
                        aria-label='Previous dates'
                        size='icon-sm'
                        variant='outline'
                        onClick={() => onSelectDate(shiftIsoDateByMonths(anchorDate, -1))}>
                        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} />
                    </Button>
                    <Button
                        aria-label='Next dates'
                        size='icon-sm'
                        variant='outline'
                        onClick={() => onSelectDate(shiftIsoDateByMonths(anchorDate, 1))}>
                        <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} />
                    </Button>
                </div>

                <div aria-live='polite' className='min-w-0 sm:text-right'>
                    <p className='text-sm font-medium tracking-tight'>{monthLabel}</p>
                </div>
            </div>

            <div className='max-w-full min-w-0 overflow-hidden border bg-background'>
                <div
                    className={cn(
                        MONTH_SURFACE_HEIGHT_CLASS,
                        'max-w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain',
                    )}
                    ref={scrollAreaRef}
                    data-testid='month-planner-scroll-area'>
                    <div
                        className='sticky top-0 z-30 overflow-hidden border-b bg-background'
                        ref={stickyHeaderRef}
                        data-testid='month-planner-sticky-header'>
                        <div className='grid grid-cols-7 bg-background'>
                            {weekdayLabels.map((label, index) => (
                                <div
                                    key={label}
                                    className={cn(
                                        'flex h-12 min-w-0 items-center justify-center border-r border-b bg-background px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase last:border-r-0',
                                        index === todayWeekdayIndex && 'bg-muted/40 text-highlight',
                                    )}
                                    data-testid='month-weekday-header'
                                    data-today-weekday={index === todayWeekdayIndex || undefined}>
                                    <span className='truncate'>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='grid grid-cols-7 bg-background'>
                        {monthGridDates.map((date, index) => {
                            const isoDate = getIsoDate(date);
                            const isToday = isSameIsoDate(date, todayIsoDate);
                            const isCurrentMonth = isDateInMonth(date, anchorDate);
                            const isWeekend = isWeekendDate(date);

                            return (
                                <button
                                    key={isoDate}
                                    aria-label={`Select ${format(date, 'd MMM, yyyy')}`}
                                    className={cn(
                                        'group relative flex min-h-36 min-w-0 flex-col border-r border-b px-3 py-2 text-left transition-colors hover:bg-muted/40 sm:min-h-40 lg:min-h-44',
                                        index % 7 === 6 && 'border-r-0',
                                        isWeekend && 'bg-muted/25',
                                        !isWeekend && !isCurrentMonth && 'bg-muted/15',
                                        isWeekend && !isCurrentMonth && 'bg-muted/35',
                                        isToday &&
                                            'bg-muted/40 outline outline-1 -outline-offset-1 outline-highlight',
                                    )}
                                    data-date-cell={isoDate}
                                    data-outside-month={!isCurrentMonth || undefined}
                                    data-today={isToday || undefined}
                                    data-weekend={isWeekend || undefined}
                                    type='button'
                                    onClick={() => onSelectDate(isoDate)}>
                                    <div className='flex items-start justify-end'>
                                        <span
                                            className={cn(
                                                'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-sm font-medium tracking-tight',
                                                isCurrentMonth
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground',
                                                isToday && 'bg-highlight text-primary-foreground',
                                            )}>
                                            {format(date, 'd')}
                                        </span>
                                    </div>

                                    <div className='flex-1' />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

function getMondayFirstWeekdayIndex(date: Date): number {
    return (date.getDay() + 6) % 7;
}

function centerMonthDateInView(
    scrollAreaElement: HTMLDivElement | null,
    stickyHeaderElement: HTMLDivElement | null,
    isoDate: string,
) {
    if (!scrollAreaElement) {
        return false;
    }

    const targetCell = scrollAreaElement.querySelector(`[data-date-cell="${isoDate}"]`);

    if (!(targetCell instanceof HTMLElement)) {
        return false;
    }

    scrollAreaElement.scrollTop = getCenteredScrollTopForMonthDate({
        cellHeight: targetCell.offsetHeight,
        cellOffsetTop: targetCell.offsetTop,
        headerHeight: stickyHeaderElement?.offsetHeight ?? 0,
        scrollHeight: scrollAreaElement.scrollHeight,
        viewportHeight: scrollAreaElement.clientHeight,
    });

    return true;
}
