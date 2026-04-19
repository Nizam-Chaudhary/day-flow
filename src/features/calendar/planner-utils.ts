import {
    addDays,
    addMonths,
    endOfMonth,
    format,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns';

import type { MockEvent } from '@/features/app-shell/mock-data';

export type PlannerMode = 'day' | 'week';
export type PlannerSnapTarget = 'previous' | 'current' | 'next';

export const CALENDAR_CELL_SIZE = 72;
export const CALENDAR_TIME_GUTTER = 88;
export const PLANNER_HEADER_HEIGHT = 64;
export const CURRENT_TIME_INDICATOR_HEIGHT = 4;
export const PLANNER_TIME_GUTTER_WIDTH = CALENDAR_TIME_GUTTER;
export const PLANNER_MIN_DAY_COLUMN_WIDTH = 180;
export const PLANNER_WIDTH_SAFETY_PX = 2;
export const MINUTES_PER_DAY = 24 * 60;
export const MONTH_GRID_DAY_COUNT = 42;
export const MONTH_GRID_WEEK_COUNT = 6;
export const MONTH_GRID_COLUMN_COUNT = 7;
const PLANNER_MODE_TARGET_DAYS = {
    day: 2,
    week: 5,
} as const satisfies Record<PlannerMode, number>;
const PLANNER_MODE_MIN_DAYS = {
    day: 1,
    week: 1,
} as const satisfies Record<PlannerMode, number>;
const PLANNER_MODE_MAX_DAYS = {
    day: 2,
    week: 5,
} as const;

export function parseTimeToMinutes(time: string): number {
    const [hoursValue, minutesValue] = time.split(':');
    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return 0;
    }

    return hours * 60 + minutes;
}

export function getEventDurationMinutes(event: Pick<MockEvent, 'endTime' | 'startTime'>): number {
    return Math.max(parseTimeToMinutes(event.endTime) - parseTimeToMinutes(event.startTime), 30);
}

export function getCurrentTimeTopOffset(currentMinutes: number): number {
    return clamp(
        (currentMinutes / 60) * CALENDAR_CELL_SIZE,
        0,
        CALENDAR_CELL_SIZE * (MINUTES_PER_DAY / 60) - CURRENT_TIME_INDICATOR_HEIGHT,
    );
}

export function getCenteredScrollTopForCurrentTime({
    currentMinutes,
    headerHeight,
    viewportHeight,
}: {
    currentMinutes: number;
    headerHeight: number;
    viewportHeight: number;
}) {
    const currentTimeTopOffset = getCurrentTimeTopOffset(currentMinutes);
    const bodyViewportHeight = Math.max(viewportHeight - headerHeight, 0);
    const totalContentHeight = headerHeight + CALENDAR_CELL_SIZE * (MINUTES_PER_DAY / 60);
    const maximumScrollTop = Math.max(totalContentHeight - viewportHeight, 0);

    return clamp(currentTimeTopOffset - bodyViewportHeight / 2, 0, maximumScrollTop);
}

export function getVisibleDayCount(width: number, mode: PlannerMode): number {
    return resolveVisibleDayCount({
        availableWidth: width,
        mode,
        preferredDays: PLANNER_MODE_TARGET_DAYS[mode],
    });
}

function resolveVisibleDayCount({
    availableWidth,
    mode,
    preferredDays,
}: {
    availableWidth: number;
    mode: PlannerMode;
    preferredDays: number;
}) {
    const safeAvailableWidth = Math.max(availableWidth - PLANNER_WIDTH_SAFETY_PX, 0);
    const usableDayAreaWidth = Math.max(safeAvailableWidth - PLANNER_TIME_GUTTER_WIDTH, 0);
    const maxReadableDays = Math.max(
        Math.floor(usableDayAreaWidth / PLANNER_MIN_DAY_COLUMN_WIDTH),
        1,
    );
    const minDays = PLANNER_MODE_MIN_DAYS[mode];
    const maxDays = Math.min(PLANNER_MODE_MAX_DAYS[mode], preferredDays);
    const resolvedDays = Math.min(maxDays, maxReadableDays);

    return Math.min(Math.max(resolvedDays, minDays), maxDays);
}

export function getNavigationStep(visibleDayCount: number): number {
    return Math.max(Math.floor(visibleDayCount / 2), 1);
}

export function buildDayRange(anchorDate: string, count: number): Date[] {
    const startDate = parseISO(anchorDate);

    return Array.from({ length: Math.max(count, 1) }, (_, index) => addDays(startDate, index));
}

export function shiftIsoDateByDays(anchorDate: string, deltaDays: number): string {
    return format(addDays(parseISO(anchorDate), deltaDays), 'yyyy-MM-dd');
}

export function shiftIsoDateByMonths(anchorDate: string, deltaMonths: number): string {
    return format(addMonths(startOfMonth(parseISO(anchorDate)), deltaMonths), 'yyyy-MM-dd');
}

export function getPlannerPageStartDates(anchorDate: string, pageSize: number): string[] {
    const normalizedPageSize = Math.max(pageSize, 1);

    return [
        shiftIsoDateByDays(anchorDate, -normalizedPageSize),
        anchorDate,
        shiftIsoDateByDays(anchorDate, normalizedPageSize),
    ];
}

export function buildBufferedDayRange(anchorDate: string, pageSize: number, pageCount = 3): Date[] {
    const normalizedPageSize = Math.max(pageSize, 1);
    const normalizedPageCount = Math.max(pageCount, 1);
    const startDate = shiftIsoDateByDays(
        anchorDate,
        -normalizedPageSize * Math.floor(normalizedPageCount / 2),
    );

    return buildDayRange(startDate, normalizedPageSize * normalizedPageCount);
}

export function getPlannerSnapTarget({
    dragOffsetPx,
    pageWidth,
    velocityPxPerMs,
    distanceThresholdRatio = 0.18,
    velocityThresholdPxPerMs = 0.45,
}: {
    dragOffsetPx: number;
    pageWidth: number;
    velocityPxPerMs: number;
    distanceThresholdRatio?: number;
    velocityThresholdPxPerMs?: number;
}): PlannerSnapTarget {
    if (pageWidth <= 0) {
        return 'current';
    }

    const distanceThresholdPx = pageWidth * distanceThresholdRatio;

    if (Math.abs(dragOffsetPx) >= distanceThresholdPx) {
        return dragOffsetPx > 0 ? 'previous' : 'next';
    }

    if (Math.abs(velocityPxPerMs) >= velocityThresholdPxPerMs) {
        return velocityPxPerMs > 0 ? 'previous' : 'next';
    }

    return 'current';
}

export function formatPlannerRangeLabel(dates: Date[]): string {
    if (dates.length === 0) {
        return '';
    }

    if (dates.length === 1) {
        return format(dates[0], 'EEEE, d MMMM, yyyy');
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    if (format(firstDate, 'yyyy-MM') === format(lastDate, 'yyyy-MM')) {
        return `${format(firstDate, 'd')} - ${format(lastDate, 'd MMM, yyyy')}`;
    }

    if (format(firstDate, 'yyyy') === format(lastDate, 'yyyy')) {
        return `${format(firstDate, 'd MMM')} - ${format(lastDate, 'd MMM, yyyy')}`;
    }

    return `${format(firstDate, 'd MMM, yyyy')} - ${format(lastDate, 'd MMM, yyyy')}`;
}

export function formatHourLabel(hour: number): string {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${normalizedHour} ${suffix}`;
}

export function getIsoDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function getSystemTodayIsoDate(): string {
    return getIsoDate(new Date());
}

export function getMonthStartDate(anchorDate: string): Date {
    return startOfMonth(parseISO(anchorDate));
}

export function getMonthLabel(anchorDate: string): string {
    return format(getMonthStartDate(anchorDate), 'MMMM yyyy');
}

export function getMonthGridDates(anchorDate: string): Date[] {
    const monthStartDate = getMonthStartDate(anchorDate);
    const monthGridStartDate = startOfWeek(monthStartDate, { weekStartsOn: 1 });

    return Array.from({ length: MONTH_GRID_DAY_COUNT }, (_, index) =>
        addDays(monthGridStartDate, index),
    );
}

export function getMonthGridWeeks(anchorDate: string): Date[][] {
    const monthGridDates = getMonthGridDates(anchorDate);

    return Array.from({ length: MONTH_GRID_WEEK_COUNT }, (_, index) =>
        monthGridDates.slice(
            index * MONTH_GRID_COLUMN_COUNT,
            (index + 1) * MONTH_GRID_COLUMN_COUNT,
        ),
    );
}

export function getMonthWeekdayLabels(): string[] {
    const referenceWeekStart = startOfWeek(new Date('2026-04-13T00:00:00'), { weekStartsOn: 1 });

    return Array.from({ length: MONTH_GRID_COLUMN_COUNT }, (_, index) =>
        format(addDays(referenceWeekStart, index), 'EEE'),
    );
}

export function isDateInMonth(date: Date, anchorDate: string): boolean {
    return format(date, 'yyyy-MM') === format(getMonthStartDate(anchorDate), 'yyyy-MM');
}

export function isWeekendDate(date: Date): boolean {
    const day = date.getDay();

    return day === 0 || day === 6;
}

export function isSameIsoDate(date: Date, isoDate: string): boolean {
    return getIsoDate(date) === isoDate;
}

export function getMonthGridEndDate(anchorDate: string): Date {
    return addDays(
        startOfWeek(getMonthStartDate(anchorDate), { weekStartsOn: 1 }),
        MONTH_GRID_DAY_COUNT - 1,
    );
}

export function getMonthLastDate(anchorDate: string): Date {
    return endOfMonth(getMonthStartDate(anchorDate));
}

export function getDateHeaderLabel(date: Date): string {
    return format(date, 'd MMM, yyyy');
}

export function getDateHeaderSubLabel(date: Date): string {
    return format(date, 'EEEE');
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
