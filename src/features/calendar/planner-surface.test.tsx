// @vitest-environment jsdom

import { act, render, screen, waitFor } from '@testing-library/react';
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
    getIsoDate,
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

        expect(await screen.findByText(getPlannerRangeLabel(0))).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Next dates' }));

        expect(screen.getByTestId('planner-track').style.transition).toContain('transform');

        await waitFor(() => {
            expect(screen.getByText(getPlannerRangeLabel(4))).toBeTruthy();
        });
    });

    it('keeps vertical scroll position across page commits', async () => {
        const user = userEvent.setup();

        renderPlannerSurface();
        await screen.findByText(getPlannerRangeLabel(0));

        const scrollArea = screen.getByTestId('planner-scroll-area');
        scrollArea.scrollTop = 240;

        await user.click(screen.getByRole('button', { name: 'Next dates' }));
        await waitFor(() => {
            expect(screen.getByText(getPlannerRangeLabel(4))).toBeTruthy();
        });

        expect(scrollArea.scrollTop).toBe(240);
    });

    it('selects a visible date immediately when a header is clicked', async () => {
        const user = userEvent.setup();
        const onSelectDate = vi.fn<(date: string) => void>();

        renderPlannerSurface({ onSelectDate });
        await screen.findByText(getPlannerRangeLabel(0));

        const selectedDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
        const selectedLabel = getDateHeaderLabel(addDays(new Date(), 1));

        await user.click(screen.getByRole('button', { name: new RegExp(selectedLabel) }));

        expect(onSelectDate).toHaveBeenCalledWith(selectedDate);
        expect(await screen.findByText(getPlannerRangeLabel(1))).toBeTruthy();
    });

    it('uses instant page commits and disables drag transitions for reduced motion', async () => {
        const user = userEvent.setup();

        mockMatchMedia(true);
        renderPlannerSurface();

        expect(await screen.findByText(getPlannerRangeLabel(0))).toBeTruthy();

        const track = screen.getByTestId('planner-track');
        await user.click(screen.getByRole('button', { name: 'Next dates' }));

        expect(track.style.transition).toBe('');
        expect(await screen.findByText(getPlannerRangeLabel(4))).toBeTruthy();

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
        expect(screen.getByText(getPlannerRangeLabel(4))).toBeTruthy();
    });

    it('keeps the buffered track clipped inside shrinkable planner wrappers', async () => {
        renderPlannerSurface();
        await screen.findByText(getPlannerRangeLabel(0));

        const plannerSurface = screen.getByTestId('planner-surface');
        const scrollArea = screen.getByTestId('planner-scroll-area');
        const track = screen.getByTestId('planner-track');
        const viewport = track.parentElement as HTMLElement;

        expect(plannerSurface.className).toContain('min-w-0');
        expect(scrollArea.className).toContain('overflow-x-hidden');
        expect(viewport.className).toContain('overflow-hidden');
        expect(viewport.className).toContain('min-w-0');
        expect(track.style.width).toBe('3840px');
    });
});

function renderPlannerSurface({
    onSelectDate,
}: {
    onSelectDate?: (date: string) => void;
} = {}) {
    function PlannerSurfaceHarness() {
        const [anchorDate, setAnchorDate] = useState(format(new Date(), 'yyyy-MM-dd'));

        return (
            <PlannerSurface
                anchorDate={anchorDate}
                events={mockEvents}
                mode='week'
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

function getPlannerRangeLabel(startOffset: number, visibleDays = 4) {
    return formatPlannerRangeLabel(
        buildDayRange(getIsoDate(addDays(new Date(), startOffset)), visibleDays),
    );
}
