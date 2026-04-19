import { describe, expect, it } from 'vitest';

import {
    buildDayRange,
    getDateHeaderLabel,
    getDateHeaderSubLabel,
    getEventDurationMinutes,
    getIsoDate,
    getNavigationStep,
    getVisibleDayCount,
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

    it('clamps visible day counts by mode', () => {
        expect(getVisibleDayCount(320, 'day')).toBe(1);
        expect(getVisibleDayCount(1600, 'day')).toBe(5);
        expect(getVisibleDayCount(960, 'week')).toBe(3);
        expect(getVisibleDayCount(1800, 'week')).toBe(7);
    });

    it('moves navigation by half the visible span rounded down with a minimum of one day', () => {
        expect(getNavigationStep(1)).toBe(1);
        expect(getNavigationStep(2)).toBe(1);
        expect(getNavigationStep(3)).toBe(1);
        expect(getNavigationStep(4)).toBe(2);
        expect(getNavigationStep(5)).toBe(2);
        expect(getNavigationStep(7)).toBe(3);
    });

    it('formats calendar date headers without repeating the weekday', () => {
        const date = new Date('2026-04-13');

        expect(getDateHeaderLabel(date)).toBe('13 Apr, 2026');
        expect(getDateHeaderSubLabel(date)).toBe('Monday');
    });
});
