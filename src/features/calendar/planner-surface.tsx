import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format, parseISO } from 'date-fns';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type MutableRefObject,
    type PointerEvent as ReactPointerEvent,
} from 'react';

import type { MockEvent } from '@/features/app-shell/mock-data';

import { Button } from '@/components/ui/button';
import {
    buildBufferedDayRange,
    buildDayRange,
    CALENDAR_CELL_SIZE,
    CALENDAR_TIME_GUTTER,
    formatHourLabel,
    formatPlannerRangeLabel,
    getDateHeaderLabel,
    getDateHeaderSubLabel,
    getEventDurationMinutes,
    getIsoDate,
    getPlannerPageStartDates,
    getPlannerSnapTarget,
    getSystemTodayIsoDate,
    getVisibleDayCount,
    parseTimeToMinutes,
    shiftIsoDateByDays,
    type PlannerMode,
    type PlannerSnapTarget,
} from '@/features/calendar/planner-utils';
import { cn } from '@/lib/utils';

interface PlannerSurfaceProps {
    anchorDate: string;
    events: MockEvent[];
    mode: PlannerMode;
    onOpenEvent(this: void, event: MockEvent): void;
    onSelectDate(this: void, date: string): void;
}

interface PlannerDragState {
    cleanup: (() => void) | null;
    hasPassedDragThreshold: boolean;
    isHorizontal: boolean;
    lastTimestamp: number;
    lastX: number;
    pointerId: number;
    startX: number;
    startY: number;
    velocityPxPerMs: number;
}

const hourRows = Array.from({ length: 24 }, (_, hour) => hour);
const TRACK_TRANSITION_MS = 220;
const DRAG_LOCK_THRESHOLD_PX = 8;

export function PlannerSurface({
    anchorDate,
    events,
    mode,
    onOpenEvent,
    onSelectDate,
}: PlannerSurfaceProps) {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const animationTimerRef = useRef<number | null>(null);
    const dragStateRef = useRef<PlannerDragState | null>(null);
    const suppressClickRef = useRef(false);
    const prefersReducedMotion = usePrefersReducedMotion();
    const [pageWidth, setPageWidth] = useState(() =>
        typeof window === 'undefined' ? 0 : window.innerWidth,
    );
    const [dragOffsetPx, setDragOffsetPx] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [transitionEnabled, setTransitionEnabled] = useState(false);
    const [activeSnapTarget, setActiveSnapTarget] = useState<PlannerSnapTarget>('current');
    const visibleDayCount = useMemo(
        () =>
            getVisibleDayCount(
                pageWidth > 0
                    ? pageWidth
                    : typeof window === 'undefined'
                      ? 1280
                      : window.innerWidth,
                mode,
            ),
        [mode, pageWidth],
    );

    const rangeDates = useMemo(
        () => buildDayRange(anchorDate, visibleDayCount),
        [anchorDate, visibleDayCount],
    );
    const pageStartDates = useMemo(
        () => getPlannerPageStartDates(anchorDate, visibleDayCount),
        [anchorDate, visibleDayCount],
    );
    const renderedDates = useMemo(
        () => buildBufferedDayRange(anchorDate, visibleDayCount),
        [anchorDate, visibleDayCount],
    );
    const pageDateGroups = useMemo(
        () => pageStartDates.map((pageStartDate) => buildDayRange(pageStartDate, visibleDayCount)),
        [pageStartDates, visibleDayCount],
    );
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
    const todayIsoDate = getSystemTodayIsoDate();
    const todayButtonLabel = `Today ${format(parseISO(todayIsoDate), 'd MMM, yyyy')}`;
    const centeredOffsetPx = pageWidth > 0 ? -pageWidth : 0;
    const trackTranslatePx = centeredOffsetPx + dragOffsetPx;

    useEffect(() => {
        const element = scrollAreaRef.current;

        if (!element) {
            setPageWidth(Math.max(Math.floor(window.innerWidth), 0));
            return;
        }

        const measure = () => {
            const measuredWidth =
                element.clientWidth || element.getBoundingClientRect().width || window.innerWidth;

            setPageWidth(Math.max(Math.floor(measuredWidth), 0));
        };

        measure();

        const observer = new ResizeObserver(() => {
            measure();
        });

        observer.observe(element);
        window.addEventListener('resize', measure);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    useEffect(() => {
        stopAnimationTimer(animationTimerRef);
        teardownDragSession(dragStateRef);
        setTransitionEnabled(false);
        setIsAnimating(false);
        setActiveSnapTarget('current');
        setDragOffsetPx(0);
    }, [anchorDate, visibleDayCount, prefersReducedMotion]);

    useEffect(
        () => () => {
            stopAnimationTimer(animationTimerRef);
            teardownDragSession(dragStateRef);
        },
        [],
    );

    const commitPageShift = (direction: -1 | 1) => {
        onSelectDate(shiftIsoDateByDays(anchorDate, direction * visibleDayCount));
    };

    const settleToTarget = (target: PlannerSnapTarget) => {
        if (prefersReducedMotion || pageWidth <= 0 || target === 'current') {
            setTransitionEnabled(false);
            setIsAnimating(false);
            setActiveSnapTarget('current');
            setDragOffsetPx(0);

            if (target === 'previous') {
                commitPageShift(-1);
            } else if (target === 'next') {
                commitPageShift(1);
            }

            return;
        }

        setTransitionEnabled(true);
        setIsAnimating(true);
        setActiveSnapTarget(target);
        setDragOffsetPx(target === 'previous' ? pageWidth : target === 'next' ? -pageWidth : 0);

        stopAnimationTimer(animationTimerRef);
        animationTimerRef.current = window.setTimeout(() => {
            setTransitionEnabled(false);
            setIsAnimating(false);
            setActiveSnapTarget('current');
            setDragOffsetPx(0);

            if (target === 'previous') {
                commitPageShift(-1);
                return;
            }

            if (target === 'next') {
                commitPageShift(1);
            }
        }, TRACK_TRANSITION_MS);
    };

    const handleNavigate = (direction: -1 | 1) => {
        if (isAnimating) {
            return;
        }

        if (prefersReducedMotion) {
            commitPageShift(direction);
            return;
        }

        settleToTarget(direction === -1 ? 'previous' : 'next');
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (
            prefersReducedMotion ||
            isAnimating ||
            pageWidth <= 0 ||
            event.button !== 0 ||
            !event.isPrimary
        ) {
            return;
        }

        if (isInteractiveElement(event.target)) {
            return;
        }

        teardownDragSession(dragStateRef);
        suppressClickRef.current = false;

        const dragState: PlannerDragState = {
            cleanup: null,
            hasPassedDragThreshold: false,
            isHorizontal: false,
            lastTimestamp: event.timeStamp || performance.now(),
            lastX: event.clientX,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            velocityPxPerMs: 0,
        };

        const handleWindowPointerMove = (nextEvent: PointerEvent) => {
            const currentDragState = dragStateRef.current;

            if (!currentDragState || nextEvent.pointerId !== currentDragState.pointerId) {
                return;
            }

            const deltaX = nextEvent.clientX - currentDragState.startX;
            const deltaY = nextEvent.clientY - currentDragState.startY;
            const elapsedMs = Math.max(
                (nextEvent.timeStamp || performance.now()) - currentDragState.lastTimestamp,
                1,
            );

            currentDragState.velocityPxPerMs =
                (nextEvent.clientX - currentDragState.lastX) / elapsedMs;
            currentDragState.lastX = nextEvent.clientX;
            currentDragState.lastTimestamp = nextEvent.timeStamp || performance.now();

            if (!currentDragState.isHorizontal) {
                if (
                    Math.abs(deltaX) <= DRAG_LOCK_THRESHOLD_PX ||
                    Math.abs(deltaX) <= Math.abs(deltaY)
                ) {
                    return;
                }

                currentDragState.isHorizontal = true;
            }

            nextEvent.preventDefault();
            currentDragState.hasPassedDragThreshold =
                currentDragState.hasPassedDragThreshold ||
                Math.abs(deltaX) > DRAG_LOCK_THRESHOLD_PX;

            setTransitionEnabled(false);
            setActiveSnapTarget('current');
            setDragOffsetPx(clamp(deltaX, -pageWidth, pageWidth));
        };

        const finalizeDrag = (nextEvent: PointerEvent) => {
            const currentDragState = dragStateRef.current;

            if (!currentDragState || nextEvent.pointerId !== currentDragState.pointerId) {
                return;
            }

            teardownDragSession(dragStateRef);

            const dragDistancePx = clamp(
                nextEvent.clientX - currentDragState.startX,
                -pageWidth,
                pageWidth,
            );

            if (currentDragState.isHorizontal) {
                nextEvent.preventDefault();
                suppressClickRef.current = currentDragState.hasPassedDragThreshold;
                settleToTarget(
                    getPlannerSnapTarget({
                        dragOffsetPx: dragDistancePx,
                        pageWidth,
                        velocityPxPerMs: currentDragState.velocityPxPerMs,
                    }),
                );
                return;
            }

            setDragOffsetPx(0);
            setTransitionEnabled(false);
            setActiveSnapTarget('current');
        };

        const cancelDrag = () => {
            teardownDragSession(dragStateRef);
            setDragOffsetPx(0);
            setTransitionEnabled(false);
            setActiveSnapTarget('current');
        };

        const cleanup = () => {
            window.removeEventListener('pointermove', handleWindowPointerMove);
            window.removeEventListener('pointerup', finalizeDrag);
            window.removeEventListener('pointercancel', cancelDrag);
        };

        dragState.cleanup = cleanup;
        dragStateRef.current = dragState;
        window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
        window.addEventListener('pointerup', finalizeDrag, { passive: false });
        window.addEventListener('pointercancel', cancelDrag);
    };

    return (
        <section className='flex max-w-full min-w-0 flex-col gap-4' data-testid='planner-surface'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                    <Button
                        aria-label={todayButtonLabel}
                        variant='outline'
                        onClick={() => onSelectDate(todayIsoDate)}>
                        {todayButtonLabel}
                    </Button>
                    <Button
                        aria-label='Previous dates'
                        size='icon-sm'
                        variant='outline'
                        onClick={() => handleNavigate(-1)}>
                        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} />
                    </Button>
                    <Button
                        aria-label='Next dates'
                        size='icon-sm'
                        variant='outline'
                        onClick={() => handleNavigate(1)}>
                        <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} />
                    </Button>
                </div>

                <div aria-live='polite' className='min-w-0 sm:text-right'>
                    <p className='text-sm font-medium tracking-tight'>{rangeLabel}</p>
                    <p className='text-xs text-muted-foreground'>{helperLabel}</p>
                </div>
            </div>

            <div className='max-w-full min-w-0 overflow-hidden border bg-background'>
                <div
                    className='max-h-[calc(100vh-19rem)] min-h-[30rem] max-w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain'
                    data-testid='planner-scroll-area'
                    ref={scrollAreaRef}>
                    <div
                        ref={viewportRef}
                        className='relative max-w-full min-w-0 overflow-hidden'
                        data-planner-drag-target='true'
                        onClickCapture={(event) => {
                            if (!suppressClickRef.current) {
                                return;
                            }

                            suppressClickRef.current = false;
                            event.preventDefault();
                            event.stopPropagation();
                        }}
                        onPointerDown={handlePointerDown}
                        style={{ touchAction: prefersReducedMotion ? 'auto' : 'pan-y' }}>
                        <div
                            className='flex will-change-transform'
                            data-planner-snap-target={activeSnapTarget}
                            data-testid='planner-track'
                            style={{
                                transform: `translateX(${trackTranslatePx}px)`,
                                transition: transitionEnabled
                                    ? `transform ${TRACK_TRANSITION_MS}ms ease`
                                    : undefined,
                                width:
                                    pageWidth > 0
                                        ? `${pageWidth * pageDateGroups.length}px`
                                        : undefined,
                            }}>
                            {pageDateGroups.map((pageDates) => (
                                <PlannerPageGrid
                                    eventsByDate={eventsByDate}
                                    key={getIsoDate(pageDates[0])}
                                    pageWidth={pageWidth}
                                    pageDates={pageDates}
                                    todayIsoDate={todayIsoDate}
                                    onOpenEvent={onOpenEvent}
                                    onSelectDate={onSelectDate}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function PlannerPageGrid({
    eventsByDate,
    onOpenEvent,
    onSelectDate,
    pageDates,
    pageWidth,
    todayIsoDate,
}: {
    eventsByDate: Map<string, MockEvent[]>;
    onOpenEvent(this: void, event: MockEvent): void;
    onSelectDate(this: void, date: string): void;
    pageDates: Date[];
    pageWidth: number;
    todayIsoDate: string;
}) {
    const gridTemplateColumns = `var(--calendar-time-gutter) repeat(${pageDates.length}, minmax(0, 1fr))`;

    return (
        <div
            className='relative shrink-0'
            style={
                {
                    '--calendar-cell-size': `${CALENDAR_CELL_SIZE}px`,
                    '--calendar-time-gutter': `${CALENDAR_TIME_GUTTER}px`,
                    width: pageWidth > 0 ? `${pageWidth}px` : '100%',
                } as CSSProperties
            }>
            <div className='sticky top-0 z-30 grid bg-background' style={{ gridTemplateColumns }}>
                <div className='sticky left-0 z-40 h-16 border-r border-b bg-background' />
                {pageDates.map((date) => {
                    const isoDate = getIsoDate(date);
                    const isTodayColumn = isoDate === todayIsoDate;

                    return (
                        <button
                            key={isoDate}
                            className={cn(
                                'flex h-16 min-w-0 flex-col items-start justify-center border-r border-b bg-background px-3 text-left transition-colors hover:bg-muted/50',
                                isTodayColumn &&
                                    'border-t border-l border-t-highlight border-r-highlight border-b-highlight border-l-highlight bg-muted/50',
                            )}
                            data-date-column={isoDate}
                            type='button'
                            onClick={() => onSelectDate(isoDate)}>
                            <span className='block min-w-0 truncate text-sm font-medium tracking-tight'>
                                {getDateHeaderLabel(date)}
                            </span>
                            <span className='block min-w-0 truncate text-xs text-muted-foreground'>
                                {getDateHeaderSubLabel(date)}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className='relative grid bg-background' style={{ gridTemplateColumns }}>
                {hourRows.map((hour) => (
                    <FragmentRow
                        hour={hour}
                        isLastHourRow={hour === hourRows[hourRows.length - 1]}
                        key={hour}
                        renderedDates={pageDates}
                        todayIsoDate={todayIsoDate}
                    />
                ))}

                <div
                    className='pointer-events-none absolute inset-y-0 right-0 left-[var(--calendar-time-gutter)] grid'
                    style={{
                        gridTemplateColumns: `repeat(${pageDates.length}, minmax(0, 1fr))`,
                    }}>
                    {pageDates.map((date) => {
                        const isoDate = getIsoDate(date);
                        const dateEvents = eventsByDate.get(isoDate) ?? [];
                        const isTodayColumn = isoDate === todayIsoDate;

                        return (
                            <div
                                key={isoDate}
                                className={cn(
                                    'relative border-r last:border-r-0',
                                    isTodayColumn &&
                                        'border-l border-r-highlight border-l-highlight',
                                )}>
                                {dateEvents.map((event) => {
                                    const topOffset =
                                        (parseTimeToMinutes(event.startTime) / 60) *
                                        CALENDAR_CELL_SIZE;
                                    const height =
                                        (getEventDurationMinutes(event) / 60) * CALENDAR_CELL_SIZE;

                                    return (
                                        <button
                                            key={event.id}
                                            aria-label={`Open event ${event.title}`}
                                            className='pointer-events-auto absolute inset-x-1.5 overflow-hidden rounded-sm border bg-primary/10 px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-primary/14'
                                            type='button'
                                            style={{
                                                height: `${Math.max(height - 4, 28)}px`,
                                                top: `${topOffset + 2}px`,
                                            }}
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
    );
}

function FragmentRow({
    hour,
    isLastHourRow,
    renderedDates,
    todayIsoDate,
}: {
    hour: number;
    isLastHourRow: boolean;
    renderedDates: Date[];
    todayIsoDate: string;
}) {
    return (
        <>
            <div className='sticky left-0 z-20 flex h-[var(--calendar-cell-size)] items-start justify-end border-r border-b bg-background px-3 py-2 text-xs text-muted-foreground'>
                {formatHourLabel(hour)}
            </div>
            {renderedDates.map((date) => {
                const isoDate = getIsoDate(date);
                const isTodayColumn = isoDate === todayIsoDate;

                return (
                    <div
                        key={`${isoDate}-${hour}`}
                        className={cn(
                            'h-[var(--calendar-cell-size)] min-w-0 border-r border-b bg-background',
                            isTodayColumn && 'border-l border-r-highlight border-l-highlight',
                            isTodayColumn && isLastHourRow && 'border-b-highlight',
                        )}
                    />
                );
            })}
        </>
    );
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}

function isInteractiveElement(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.closest('button, a, input, textarea, select, label, [role="button"]') !== null
    );
}

function teardownDragSession(dragStateRef: MutableRefObject<PlannerDragState | null>) {
    dragStateRef.current?.cleanup?.();
    dragStateRef.current = null;
}

function stopAnimationTimer(animationTimerRef: MutableRefObject<number | null>) {
    if (animationTimerRef.current === null) {
        return;
    }

    window.clearTimeout(animationTimerRef.current);
    animationTimerRef.current = null;
}

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = () => {
            setPrefersReducedMotion(mediaQuery.matches);
        };

        updatePreference();
        mediaQuery.addEventListener('change', updatePreference);

        return () => {
            mediaQuery.removeEventListener('change', updatePreference);
        };
    }, []);

    return prefersReducedMotion;
}
