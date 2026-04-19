import { useEffect, useRef, useState } from 'react';

import { getVisibleDayCount, type PlannerMode } from '@/features/calendar/planner-utils';

export function useVisibleDayCount(mode: PlannerMode) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [visibleDayCount, setVisibleDayCount] = useState(() =>
        getVisibleDayCount(typeof window === 'undefined' ? 1280 : window.innerWidth, mode),
    );

    useEffect(() => {
        const element = containerRef.current;

        if (!element) {
            setVisibleDayCount(getVisibleDayCount(window.innerWidth, mode));
            return;
        }

        const measure = () => {
            const nextWidth =
                element.clientWidth || element.getBoundingClientRect().width || window.innerWidth;

            setVisibleDayCount(getVisibleDayCount(nextWidth, mode));
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
    }, [mode]);

    return {
        containerRef,
        visibleDayCount,
    };
}
