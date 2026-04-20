// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MonthPlannerSurface } from '@/components/calendar/month-planner-surface';

describe('MonthPlannerSurface', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));
    });

    it('renders a monday-first sticky weekday header', () => {
        renderMonthPlannerSurface();

        expect(
            screen.getAllByTestId('month-weekday-header').map((header) => header.textContent),
        ).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

        expect(screen.getByTestId('month-planner-sticky-header').className).toContain('sticky');
        expect(screen.getByTestId('month-planner-sticky-header').className).toContain('top-0');
    });

    it('highlights the current weekday in the month header', () => {
        renderMonthPlannerSurface();

        const headers = screen.getAllByTestId('month-weekday-header');
        const todayWeekdayHeader = headers[6] as HTMLElement;

        expect(todayWeekdayHeader.textContent).toBe('Sun');
        expect(todayWeekdayHeader.getAttribute('data-today-weekday')).toBe('true');
        expect(todayWeekdayHeader.className).toContain('text-highlight');
    });

    it('renders a dynamic month grid with weekend and outside-month markers', () => {
        renderMonthPlannerSurface();

        const dayCells = screen.getAllByRole('button', { name: /Select / });
        const weekendCells = dayCells.filter(
            (cell) => cell.getAttribute('data-weekend') === 'true',
        );
        const outsideMonthCell = document.querySelector(
            '[data-date-cell="2026-03-30"]',
        ) as HTMLElement;

        expect(dayCells).toHaveLength(35);
        expect(weekendCells).toHaveLength(10);
        expect(outsideMonthCell.getAttribute('data-outside-month')).toBe('true');
        expect(outsideMonthCell.className).toContain('text-left');
    });

    it('highlights today with the highlight border and date pill', () => {
        renderMonthPlannerSurface();

        const todayCell = document.querySelector('[data-date-cell="2026-04-19"]') as HTMLElement;
        const todayPill = screen.getByText('19');

        expect(todayCell.getAttribute('data-today')).toBe('true');
        expect(todayCell.className).toContain('outline-highlight');
        expect(todayPill.className).toContain('bg-highlight');
    });

    it('moves by full months with the existing navigation controls', () => {
        renderMonthPlannerSurfaceHarness({ anchorDate: '2026-04-19' });
        expect(screen.getByText('April 2026')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Next dates' }));
        expect(screen.getByText('May 2026')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Previous dates' }));
        expect(screen.getByText('April 2026')).toBeTruthy();
    });

    it('resets back to today when clicking the today button', () => {
        renderMonthPlannerSurfaceHarness({ anchorDate: '2026-05-06' });

        fireEvent.click(screen.getByRole('button', { name: getTodayButtonLabel() }));

        expect(screen.getByText('April 2026')).toBeTruthy();
        expect(
            (document.querySelector('[data-date-cell="2026-04-19"]') as HTMLElement).getAttribute(
                'data-today',
            ),
        ).toBe('true');
    });

    it('selects exact dates from the current month and adjacent spillover cells', () => {
        const onSelectDate = vi.fn<(date: string) => void>();
        renderMonthPlannerSurfaceHarness({ anchorDate: '2026-04-19', onSelectDate });

        fireEvent.click(screen.getByRole('button', { name: 'Select 16 Apr, 2026' }));
        fireEvent.click(screen.getByRole('button', { name: 'Select 30 Mar, 2026' }));

        expect(onSelectDate).toHaveBeenCalledWith('2026-04-16');
        expect(onSelectDate).toHaveBeenCalledWith('2026-03-30');
        expect(screen.getByText('March 2026')).toBeTruthy();
    });

    it('centers today in the scroll viewport on initial render when today is in the month', () => {
        mockMonthLayoutMetrics();
        renderMonthPlannerSurface();

        expect(screen.getByTestId('month-planner-scroll-area').scrollTop).toBe(108);
    });

    it('recenters today when clicking the today button from another month', () => {
        mockMonthLayoutMetrics();
        renderMonthPlannerSurfaceHarness({ anchorDate: '2026-05-06' });

        const scrollArea = screen.getByTestId('month-planner-scroll-area');
        expect(scrollArea.scrollTop).toBe(0);

        fireEvent.click(screen.getByRole('button', { name: getTodayButtonLabel() }));

        expect(screen.getByText('April 2026')).toBeTruthy();
        expect(scrollArea.scrollTop).toBe(108);
    });

    it('recenters today when clicking the today button while already on the current month', () => {
        mockMonthLayoutMetrics();
        renderMonthPlannerSurfaceHarness({ anchorDate: '2026-04-03' });

        const scrollArea = screen.getByTestId('month-planner-scroll-area');
        expect(scrollArea.scrollTop).toBe(108);

        scrollArea.scrollTop = 0;
        fireEvent.click(screen.getByRole('button', { name: getTodayButtonLabel() }));

        expect(screen.getByText('April 2026')).toBeTruthy();
        expect(scrollArea.scrollTop).toBe(108);
    });
});

function MonthPlannerSurfaceHarness({
    anchorDate,
    onSelectDate,
}: {
    anchorDate: string;
    onSelectDate?(this: void, date: string): void;
}) {
    const [selectedDate, setSelectedDate] = useState(anchorDate);

    return (
        <MonthPlannerSurface
            anchorDate={selectedDate}
            onSelectDate={(date) => {
                setSelectedDate(date);
                onSelectDate?.(date);
            }}
        />
    );
}

function renderMonthPlannerSurface(anchorDate = '2026-04-19') {
    return render(<MonthPlannerSurface anchorDate={anchorDate} onSelectDate={() => {}} />);
}

function renderMonthPlannerSurfaceHarness({
    anchorDate,
    onSelectDate,
}: {
    anchorDate: string;
    onSelectDate?(this: void, date: string): void;
}) {
    return render(
        <MonthPlannerSurfaceHarness anchorDate={anchorDate} onSelectDate={onSelectDate} />,
    );
}

function getTodayButtonLabel() {
    return `Today ${format(new Date(), 'd MMM, yyyy')}`;
}

function mockMonthLayoutMetrics() {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
            return this.getAttribute('data-testid') === 'month-planner-scroll-area' ? 600 : 0;
        },
    );
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
            return this.getAttribute('data-testid') === 'month-planner-scroll-area' ? 900 : 0;
        },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
            if (this.getAttribute('data-testid') === 'month-planner-sticky-header') {
                return 48;
            }

            if (this.getAttribute('data-date-cell') === '2026-04-19') {
                return 144;
            }

            return 0;
        },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(
        function (this: HTMLElement) {
            return this.getAttribute('data-date-cell') === '2026-04-19' ? 360 : 0;
        },
    );
}
