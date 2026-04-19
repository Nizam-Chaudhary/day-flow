import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';

import type { MockEvent } from '@/features/app-shell/mock-data';

export type PlannerMode = 'day' | 'week';

export interface VisibleWeekSlice {
    endIndex: number;
    startIndex: number;
}

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

export function buildDayRange(anchorDate: string, count: number): Date[] {
    const startDate = parseISO(anchorDate);

    return Array.from({ length: Math.max(count, 1) }, (_, index) => addDays(startDate, index));
}

export function buildWeekRange(anchorDate: string, weekStartsOn: 0 | 1): Date[] {
    const weekStart = startOfWeek(parseISO(anchorDate), { weekStartsOn });

    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getVisibleWeekSlice(
    weekDates: Date[],
    anchorDate: string,
    visibleCount: number,
): VisibleWeekSlice {
    const safeVisibleCount = Math.max(1, Math.min(visibleCount, weekDates.length));
    const anchor = parseISO(anchorDate);
    const anchorIndex = Math.max(
        weekDates.findIndex((date) => isSameDay(date, anchor)),
        0,
    );
    const maxStartIndex = Math.max(weekDates.length - safeVisibleCount, 0);
    const preferredStartIndex = Math.max(anchorIndex - safeVisibleCount + 1, 0);
    const startIndex = Math.min(preferredStartIndex, maxStartIndex);

    return {
        endIndex: startIndex + safeVisibleCount - 1,
        startIndex,
    };
}

export function formatPlannerRangeLabel(dates: Date[]): string {
    if (dates.length === 0) {
        return '';
    }

    if (dates.length === 1) {
        return format(dates[0], 'EEEE, d MMMM yyyy');
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    if (format(firstDate, 'yyyy-MM') === format(lastDate, 'yyyy-MM')) {
        return `${format(firstDate, 'd')} - ${format(lastDate, 'd MMM yyyy')}`;
    }

    if (format(firstDate, 'yyyy') === format(lastDate, 'yyyy')) {
        return `${format(firstDate, 'd MMM')} - ${format(lastDate, 'd MMM yyyy')}`;
    }

    return `${format(firstDate, 'd MMM yyyy')} - ${format(lastDate, 'd MMM yyyy')}`;
}

export function formatHourLabel(hour: number): string {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${normalizedHour} ${suffix}`;
}

export function getIsoDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function getDateHeaderLabel(date: Date): string {
    return format(date, 'EEE - d MMM');
}

export function getDateHeaderSubLabel(date: Date): string {
    return format(date, 'EEEE');
}
