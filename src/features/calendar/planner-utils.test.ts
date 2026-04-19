import { describe, expect, it } from 'vitest';

import {
    buildBufferedDayRange,
    buildDayRange,
    CALENDAR_CELL_SIZE,
    CURRENT_TIME_INDICATOR_HEIGHT,
    formatPlannerRangeLabel,
    getDateHeaderLabel,
    getDateHeaderSubLabel,
    getCenteredScrollTopForCurrentTime,
    getCurrentTimeTopOffset,
    getEventDurationMinutes,
    getIsoDate,
    getPlannerPageStartDates,
    getPlannerSnapTarget,
    getVisibleDayCount,
    PLANNER_HEADER_HEIGHT,
    parseTimeToMinutes,
    shiftIsoDateByDays,
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

    it('positions the current-time offset within the planner grid', () => {
        expect(getCurrentTimeTopOffset(10 * 60 + 30)).toBe(10.5 * CALENDAR_CELL_SIZE);
    });

    it('clamps the current-time offset near the start and end of the day', () => {
        expect(getCurrentTimeTopOffset(-30)).toBe(0);
        expect(getCurrentTimeTopOffset(24 * 60 + 30)).toBe(
            CALENDAR_CELL_SIZE * 24 - CURRENT_TIME_INDICATOR_HEIGHT,
        );
    });

    it('centers the current time within the visible planner body', () => {
        expect(
            getCenteredScrollTopForCurrentTime({
                currentMinutes: 10 * 60 + 30,
                headerHeight: PLANNER_HEADER_HEIGHT,
                viewportHeight: 720,
            }),
        ).toBe(428);
    });

    it('clamps centered scroll positions near midnight', () => {
        expect(
            getCenteredScrollTopForCurrentTime({
                currentMinutes: 15,
                headerHeight: PLANNER_HEADER_HEIGHT,
                viewportHeight: 720,
            }),
        ).toBe(0);
    });

    it('clamps centered scroll positions near the end of day', () => {
        expect(
            getCenteredScrollTopForCurrentTime({
                currentMinutes: 23 * 60 + 59,
                headerHeight: PLANNER_HEADER_HEIGHT,
                viewportHeight: 720,
            }),
        ).toBe(1072);
    });

    it('supports small viewport heights when centering the current time', () => {
        expect(
            getCenteredScrollTopForCurrentTime({
                currentMinutes: 10 * 60 + 30,
                headerHeight: PLANNER_HEADER_HEIGHT,
                viewportHeight: 120,
            }),
        ).toBe(728);
    });

    it('builds a day range from the selected date', () => {
        expect(buildDayRange('2026-04-13', 3).map(getIsoDate)).toEqual([
            '2026-04-13',
            '2026-04-14',
            '2026-04-15',
        ]);
    });

    it('builds a buffered day range centered around the committed page', () => {
        expect(buildBufferedDayRange('2026-04-13', 2).map(getIsoDate)).toEqual([
            '2026-04-11',
            '2026-04-12',
            '2026-04-13',
            '2026-04-14',
            '2026-04-15',
            '2026-04-16',
        ]);
    });

    it('shifts and groups planner page start dates by full pages', () => {
        expect(shiftIsoDateByDays('2026-04-13', 4)).toBe('2026-04-17');
        expect(getPlannerPageStartDates('2026-04-13', 3)).toEqual([
            '2026-04-10',
            '2026-04-13',
            '2026-04-16',
        ]);
    });

    it('resolves week mode visible day counts from available width', () => {
        expect(getVisibleDayCount(1280, 'week')).toBe(5);
        expect(getVisibleDayCount(980, 'week')).toBe(4);
        expect(getVisibleDayCount(760, 'week')).toBe(3);
        expect(getVisibleDayCount(620, 'week')).toBe(2);
        expect(getVisibleDayCount(440, 'week')).toBe(1);
    });

    it('resolves day mode visible day counts from available width', () => {
        expect(getVisibleDayCount(1280, 'day')).toBe(2);
        expect(getVisibleDayCount(620, 'day')).toBe(2);
        expect(getVisibleDayCount(440, 'day')).toBe(1);
    });

    it('caps visible day counts by mode targets', () => {
        expect(getVisibleDayCount(320, 'day')).toBe(1);
        expect(getVisibleDayCount(1800, 'day')).toBe(2);
        expect(getVisibleDayCount(2200, 'week')).toBe(5);
    });

    it('uses a safety margin to avoid resolving one extra day at thresholds', () => {
        expect(getVisibleDayCount(988, 'week')).toBe(4);
        expect(getVisibleDayCount(989, 'week')).toBe(4);
        expect(getVisibleDayCount(990, 'week')).toBe(5);
        expect(getVisibleDayCount(449, 'day')).toBe(1);
        expect(getVisibleDayCount(450, 'day')).toBe(2);
    });

    it('resolves planner snap targets from distance and velocity', () => {
        expect(
            getPlannerSnapTarget({
                dragOffsetPx: 10,
                pageWidth: 400,
                velocityPxPerMs: 0.1,
            }),
        ).toBe('current');

        expect(
            getPlannerSnapTarget({
                dragOffsetPx: 90,
                pageWidth: 400,
                velocityPxPerMs: 0.1,
            }),
        ).toBe('previous');

        expect(
            getPlannerSnapTarget({
                dragOffsetPx: -90,
                pageWidth: 400,
                velocityPxPerMs: 0.1,
            }),
        ).toBe('next');

        expect(
            getPlannerSnapTarget({
                dragOffsetPx: 12,
                pageWidth: 400,
                velocityPxPerMs: 0.5,
            }),
        ).toBe('previous');

        expect(
            getPlannerSnapTarget({
                dragOffsetPx: -12,
                pageWidth: 400,
                velocityPxPerMs: -0.5,
            }),
        ).toBe('next');
    });

    it('formats calendar date headers without repeating the weekday', () => {
        const date = new Date('2026-04-13');

        expect(getDateHeaderLabel(date)).toBe('13 Apr, 2026');
        expect(getDateHeaderSubLabel(date)).toBe('Monday');
    });

    it('formats planner range labels with a comma before the year', () => {
        expect(formatPlannerRangeLabel([new Date('2026-04-13')])).toBe('Monday, 13 April, 2026');
        expect(
            formatPlannerRangeLabel([
                new Date('2026-04-13'),
                new Date('2026-04-14'),
                new Date('2026-04-15'),
            ]),
        ).toBe('13 - 15 Apr, 2026');
        expect(formatPlannerRangeLabel([new Date('2026-04-30'), new Date('2026-05-02')])).toBe(
            '30 Apr - 2 May, 2026',
        );
        expect(formatPlannerRangeLabel([new Date('2026-12-31'), new Date('2027-01-02')])).toBe(
            '31 Dec, 2026 - 2 Jan, 2027',
        );
    });
});
