// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format } from 'date-fns';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockEvents } from '@/features/app-shell/mock-data';
import { PlannerSurface } from '@/features/calendar/planner-surface';
import {
    buildDayRange,
    formatPlannerRangeLabel,
    getDateHeaderLabel,
    getCenteredScrollTopForCurrentTime,
    getIsoDate,
    PLANNER_HEADER_HEIGHT,
} from '@/features/calendar/planner-utils';

describe('PlannerSurface', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        mockMatchMedia(false);
        mockElementMeasurements(1280);
        setViewportWidth(1280);
        vi.stubGlobal('PointerEvent', MouseEvent);
    });

    it('commits one full visible page after next navigation settles', async () => {
        const user = userEvent.setup();

        renderPlannerSurface();

        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Next dates' }));

        expect(screen.getByTestId('planner-track').style.transition).toContain('transform');
        expect(screen.getByTestId('planner-header-track').style.transition).toContain('transform');

        await waitFor(() => {
            expect(screen.getByText(getPlannerRangeLabel(5, 5))).toBeTruthy();
        });
    });

    it('keeps vertical scroll position across page commits', async () => {
        const user = userEvent.setup();

        renderPlannerSurface();
        await screen.findByText(getPlannerRangeLabel(0, 5));

        const scrollArea = screen.getByTestId('planner-scroll-area');
        scrollArea.scrollTop = 240;

        await user.click(screen.getByRole('button', { name: 'Next dates' }));
        await waitFor(() => {
            expect(screen.getByText(getPlannerRangeLabel(5, 5))).toBeTruthy();
        });

        expect(scrollArea.scrollTop).toBe(240);
    });

    it('centers the current time on initial render when today is visible', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        renderPlannerSurface();

        const scrollArea = screen.getByTestId('planner-scroll-area');

        expect(scrollArea.scrollTop).toBe(
            getCenteredScrollTopForCurrentTime({
                currentMinutes: 10 * 60 + 30,
                headerHeight: PLANNER_HEADER_HEIGHT,
                viewportHeight: 720,
            }),
        );
    });

    it('does not auto-scroll on initial render when today is not visible', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        renderPlannerSurface({ anchorDate: '2026-04-24' });

        expect(screen.getByText(getPlannerRangeLabel(5, 5))).toBeTruthy();
        expect(screen.getByTestId('planner-scroll-area').scrollTop).toBe(0);
    });

    it('recenters the current time after clicking today', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        renderPlannerSurface({ anchorDate: '2026-04-24' });
        expect(screen.getByText(getPlannerRangeLabel(5, 5))).toBeTruthy();

        const scrollArea = screen.getByTestId('planner-scroll-area');
        scrollArea.scrollTop = 96;

        fireEvent.click(screen.getByRole('button', { name: 'Today 19 Apr, 2026' }));
        expect(screen.getByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
        expect(scrollArea.scrollTop).toBe(
            getCenteredScrollTopForCurrentTime({
                currentMinutes: 10 * 60 + 30,
                headerHeight: PLANNER_HEADER_HEIGHT,
                viewportHeight: 720,
            }),
        );
    });

    it('selects a visible date immediately when a header is clicked', async () => {
        const user = userEvent.setup();
        const onSelectDate = vi.fn<(date: string) => void>();

        renderPlannerSurface({ onSelectDate });
        await screen.findByText(getPlannerRangeLabel(0, 5));

        const selectedDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        const selectedLabel = getDateHeaderLabel(addDays(new Date(), 1));

        await user.click(screen.getByRole('button', { name: new RegExp(selectedLabel) }));

        expect(onSelectDate).toHaveBeenCalledWith(selectedDate);
        expect(await screen.findByText(getPlannerRangeLabel(1, 5))).toBeTruthy();
    });

    it('uses instant page commits and disables drag transitions for reduced motion', async () => {
        const user = userEvent.setup();

        mockMatchMedia(true);
        renderPlannerSurface();

        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();

        const track = screen.getByTestId('planner-track');
        await user.click(screen.getByRole('button', { name: 'Next dates' }));

        expect(track.style.transition).toBe('');
        expect(await screen.findByText(getPlannerRangeLabel(5, 5))).toBeTruthy();

        const dragTarget = track.parentElement as HTMLElement;

        await act(async () => {
            dragTarget.dispatchEvent(
                new PointerEvent('pointerdown', {
                    bubbles: true,
                    button: 0,
                    clientX: 400,
                    clientY: 100,
                    isPrimary: true,
                    pointerId: 1,
                }),
            );
            window.dispatchEvent(
                new PointerEvent('pointermove', {
                    bubbles: true,
                    clientX: 200,
                    clientY: 100,
                    pointerId: 1,
                }),
            );
            window.dispatchEvent(
                new PointerEvent('pointerup', {
                    bubbles: true,
                    clientX: 200,
                    clientY: 100,
                    pointerId: 1,
                }),
            );
        });

        expect(track.style.transform).toContain('-1280px');
        expect(screen.getByText(getPlannerRangeLabel(5, 5))).toBeTruthy();
    });

    it('keeps the buffered track clipped inside shrinkable planner wrappers', async () => {
        renderPlannerSurface();
        await screen.findByText(getPlannerRangeLabel(0, 5));

        const plannerSurface = screen.getByTestId('planner-surface');
        const stickyHeaders = screen.getAllByTestId('planner-sticky-header');
        const stickyHeader = stickyHeaders[0];
        const scrollArea = screen.getByTestId('planner-scroll-area');
        const headerTrack = screen.getByTestId('planner-header-track');
        const track = screen.getByTestId('planner-track');
        const bodyViewport = screen.getByTestId('planner-body-viewport');
        const viewport = track.parentElement as HTMLElement;
        const page = track.firstElementChild as HTMLElement;
        const headerPage = headerTrack.firstElementChild as HTMLElement;
        const dateColumn = headerPage.querySelector('[data-date-column]') as HTMLElement;
        const dateLabel = headerPage.querySelector('[data-date-column] > span') as HTMLElement;
        const bodyGrid = page.firstElementChild as HTMLElement;
        const overlayGrid = bodyGrid.lastElementChild as HTMLElement;
        const hourCell = bodyGrid.querySelector(
            '[class*="min-w-0"][class*="border-r"][class*="border-b"]',
        ) as HTMLElement;

        expect(stickyHeaders).toHaveLength(1);
        expect(plannerSurface.className).toContain('min-w-0');
        expect(stickyHeader.className).toContain('sticky');
        expect(stickyHeader.className).toContain('top-0');
        expect(stickyHeader.nextElementSibling).toBe(bodyViewport);
        expect(track.contains(stickyHeader)).toBe(false);
        expect(scrollArea.className).toContain('overflow-x-hidden');
        expect(viewport.className).toContain('overflow-hidden');
        expect(viewport.className).toContain('min-w-0');
        expect(headerTrack.style.width).toBe('3840px');
        expect(track.style.width).toBe('3840px');
        expect(headerPage.style.minWidth).toBe('');
        expect(page.style.minWidth).toBe('');
        expect(headerPage.style.width).toBe('1280px');
        expect(page.style.width).toBe('1280px');
        expect(dateColumn.className).not.toContain('min-w-[var(--calendar-cell-size)]');
        expect(dateColumn.className).toContain('min-w-0');
        expect(dateLabel.className).toContain('truncate');
        expect(bodyGrid.style.gridTemplateColumns).toContain('minmax(0, 1fr)');
        expect(overlayGrid.style.gridTemplateColumns).toContain('minmax(0, 1fr)');
        expect(hourCell.className).not.toContain('min-w-[var(--calendar-cell-size)]');
        expect(hourCell.className).toContain('min-w-0');
    });

    it('keeps header and body tracks in sync during navigation', async () => {
        const user = userEvent.setup();

        renderPlannerSurface();
        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();

        const headerTrack = screen.getByTestId('planner-header-track');
        const bodyTrack = screen.getByTestId('planner-track');

        expect(headerTrack.style.width).toBe(bodyTrack.style.width);
        expect(headerTrack.style.transform).toBe(bodyTrack.style.transform);

        await user.click(screen.getByRole('button', { name: 'Next dates' }));

        expect(headerTrack.style.width).toBe(bodyTrack.style.width);
        expect(headerTrack.style.transform).toBe(bodyTrack.style.transform);
    });

    it('keeps header and body tracks in sync during drag preview', async () => {
        renderPlannerSurface();
        expect(await screen.findByText(getPlannerRangeLabel(0, 5))).toBeTruthy();

        const headerTrack = screen.getByTestId('planner-header-track');
        const bodyTrack = screen.getByTestId('planner-track');
        const dragTarget = screen.getByTestId('planner-body-viewport');

        await act(async () => {
            dragTarget.dispatchEvent(
                new PointerEvent('pointerdown', {
                    bubbles: true,
                    button: 0,
                    clientX: 400,
                    clientY: 100,
                    isPrimary: true,
                    pointerId: 1,
                }),
            );
            window.dispatchEvent(
                new PointerEvent('pointermove', {
                    bubbles: true,
                    clientX: 260,
                    clientY: 100,
                    pointerId: 1,
                }),
            );
        });

        expect(headerTrack.style.transform).toBe(bodyTrack.style.transform);
    });

    it('falls back to fewer week columns when width is constrained', async () => {
        mockElementMeasurements(980);
        setViewportWidth(980);

        renderPlannerSurface();

        expect(await screen.findByText(getPlannerRangeLabel(0, 4))).toBeTruthy();
    });

    it('resolves visible days from the measured planner viewport width', async () => {
        mockElementMeasurements(980);
        setViewportWidth(1280);

        renderPlannerSurface();

        expect(await screen.findByText(getPlannerRangeLabel(0, 4))).toBeTruthy();
        expect(screen.getByTestId('planner-track').style.width).toBe('2940px');
    });

    it('shows two visible days in day mode when width allows it', async () => {
        renderPlannerSurface({ mode: 'day' });

        expect(await screen.findByText(getPlannerRangeLabel(0, 2))).toBeTruthy();
    });

    it('falls back to one visible day in day mode when width is constrained', async () => {
        mockElementMeasurements(440);
        setViewportWidth(440);

        renderPlannerSurface({ mode: 'day' });

        expect(await screen.findByText(getPlannerRangeLabel(0, 1))).toBeTruthy();
    });

    it('renders one current-time indicator in the visible today column', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        renderPlannerSurface();

        expect(screen.getByText(getPlannerRangeLabel(0, 5))).toBeTruthy();

        const indicator = screen.getByTestId('current-time-indicator');
        expect(screen.getAllByTestId('current-time-indicator')).toHaveLength(1);
        expect(indicator.parentElement?.getAttribute('data-date-overlay-column')).toBe(
            '2026-04-19',
        );
    });

    it('does not render the current-time indicator when today is not visible', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        renderPlannerSurface({ anchorDate: '2026-04-24' });

        expect(screen.getByText(getPlannerRangeLabel(5, 5))).toBeTruthy();
        expect(screen.queryByTestId('current-time-indicator')).toBeNull();
    });

    it('positions the current-time indicator based on the current minute', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        renderPlannerSurface();

        expect(screen.getByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
        expect(screen.getByTestId('current-time-indicator').style.top).toBe('756px');
        expect(screen.getByTestId('current-time-indicator').style.height).toBe('4px');
    });

    it('updates the current-time indicator at the next minute boundary', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:45'));

        renderPlannerSurface();

        expect(screen.getByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
        expect(screen.getByTestId('current-time-indicator').style.top).toBe('756px');

        await act(async () => {
            vi.advanceTimersByTime(15_000);
        });

        expect(screen.getByTestId('current-time-indicator').style.top).toBe('757.2px');
    });

    it('cleans up the current-time timer on unmount', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-19T10:30:00'));

        const { unmount } = renderPlannerSurface();

        expect(screen.getByText(getPlannerRangeLabel(0, 5))).toBeTruthy();
        expect(vi.getTimerCount()).toBe(1);

        unmount();

        expect(vi.getTimerCount()).toBe(0);
    });
});

function renderPlannerSurface({
    anchorDate,
    mode = 'week',
    onSelectDate,
}: {
    anchorDate?: string;
    mode?: 'day' | 'week';
    onSelectDate?: (date: string) => void;
} = {}) {
    function PlannerSurfaceHarness() {
        const [activeAnchorDate, setAnchorDate] = useState(
            anchorDate ?? format(new Date(), 'yyyy-MM-dd'),
        );

        return (
            <PlannerSurface
                anchorDate={activeAnchorDate}
                events={mockEvents}
                mode={mode}
                onOpenEvent={vi.fn<(event: (typeof mockEvents)[number]) => void>()}
                onSelectDate={(date) => {
                    onSelectDate?.(date);
                    setAnchorDate(date);
                }}
            />
        );
    }

    return render(<PlannerSurfaceHarness />);
}

function setViewportWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: width,
    });
}

function mockElementMeasurements(width: number) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
        return {
            bottom: 720,
            height: 720,
            left: 0,
            right: width,
            top: 0,
            width,
            x: 0,
            y: 0,
            toJSON() {
                return {};
            },
        };
    });

    class ResizeObserverMock {
        observe() {}
        disconnect() {}
        unobserve() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
}

function mockMatchMedia(prefersReducedMotion: boolean) {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        addEventListener:
            vi.fn<(type: string, listener: EventListenerOrEventListenerObject) => void>(),
        dispatchEvent: vi.fn<(event: Event) => boolean>(),
        matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
        media: query,
        onchange: null,
        removeEventListener:
            vi.fn<(type: string, listener: EventListenerOrEventListenerObject) => void>(),
        addListener:
            vi.fn<(listener: (this: MediaQueryList, event: MediaQueryListEvent) => void) => void>(),
        removeListener:
            vi.fn<(listener: (this: MediaQueryList, event: MediaQueryListEvent) => void) => void>(),
    }));
}

function getPlannerRangeLabel(startOffset: number, visibleDays: number) {
    return formatPlannerRangeLabel(
        buildDayRange(getIsoDate(addDays(new Date(), startOffset)), visibleDays),
    );
}
