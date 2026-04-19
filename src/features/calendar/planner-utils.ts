import { addDays, format, parseISO } from 'date-fns';

import type { MockEvent } from '@/features/app-shell/mock-data';

export type PlannerMode = 'day' | 'week';
export type PlannerSnapTarget = 'previous' | 'current' | 'next';

export const CALENDAR_CELL_SIZE = 72;
export const CALENDAR_TIME_GUTTER = 88;

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

export function getVisibleDayCount(width: number, mode: PlannerMode): number {
    const usableWidth = Math.max(width - CALENDAR_TIME_GUTTER, 0);

    let count = 1;

    if (usableWidth >= 1440) {
        count = 7;
    } else if (usableWidth >= 1200) {
        count = 5;
    } else if (usableWidth >= 960) {
        count = 4;
    } else if (usableWidth >= 720) {
        count = 3;
    } else if (usableWidth >= 480) {
        count = 2;
    }

    return mode === 'day' ? Math.min(count, 5) : Math.min(count, 7);
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

export function getDateHeaderLabel(date: Date): string {
    return format(date, 'd MMM, yyyy');
}

export function getDateHeaderSubLabel(date: Date): string {
    return format(date, 'EEEE');
}
