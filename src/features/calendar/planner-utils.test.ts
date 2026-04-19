import { describe, expect, it } from 'vitest';

import {
    buildDayRange,
    buildWeekRange,
    getDateHeaderLabel,
    getDateHeaderSubLabel,
    getEventDurationMinutes,
    getIsoDate,
    getVisibleDayCount,
    getVisibleWeekSlice,
    parseTimeToMinutes,
} from '@/features/calendar/planner-utils';

describe('planner utils', () => {
    it('parses clock times to minutes', () => {
        expect(parseTimeToMinutes('00:00')).toBe(0);
        expect(parseTimeToMinutes('09:30')).toBe(570);
        expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('computes event duration from start and end times', () => {
        expect(getEventDurationMinutes({ endTime: '09:45', startTime: '09:00' })).toBe(45);
        expect(getEventDurationMinutes({ endTime: '10:00', startTime: '10:00' })).toBe(30);
    });

    it('builds a day range from the selected date', () => {
        expect(buildDayRange('2026-04-13', 3).map(getIsoDate)).toEqual([
            '2026-04-13',
            '2026-04-14',
            '2026-04-15',
        ]);
    });

    it('builds a week range from the configured week start', () => {
        expect(buildWeekRange('2026-04-18', 1).map(getIsoDate)).toEqual([
            '2026-04-13',
            '2026-04-14',
            '2026-04-15',
            '2026-04-16',
            '2026-04-17',
            '2026-04-18',
            '2026-04-19',
        ]);
    });

    it('keeps the selected day inside the visible week slice', () => {
        const weekDates = buildWeekRange('2026-04-18', 1);

        expect(getVisibleWeekSlice(weekDates, '2026-04-18', 4)).toEqual({
            endIndex: 5,
            startIndex: 2,
        });
        expect(getVisibleWeekSlice(weekDates, '2026-04-13', 4)).toEqual({
            endIndex: 3,
            startIndex: 0,
        });
    });

    it('clamps visible day counts by mode', () => {
        expect(getVisibleDayCount(320, 'day')).toBe(1);
        expect(getVisibleDayCount(1600, 'day')).toBe(5);
        expect(getVisibleDayCount(960, 'week')).toBe(3);
        expect(getVisibleDayCount(1800, 'week')).toBe(7);
    });

    it('formats calendar date headers without repeating the weekday', () => {
        const date = new Date('2026-04-13');

        expect(getDateHeaderLabel(date)).toBe('13 Apr, 2026');
        expect(getDateHeaderSubLabel(date)).toBe('Monday');
    });
});
