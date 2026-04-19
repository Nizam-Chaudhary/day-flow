// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { describe, expect, it } from 'vitest';

import { DayFlowLogo } from '@/components/brand/day-flow-logo';

describe('DayFlowLogo', () => {
    it('uses the dark asset on light themes', () => {
        renderWithTheme(<DayFlowLogo kind='mark' label='Day Flow' />, 'light');

        const logo = screen.getByRole('img', { name: 'Day Flow' });

        expect(logo.getAttribute('data-variant')).toBe('dark');
    });

    it('uses the light asset on dark themes', () => {
        renderWithTheme(<DayFlowLogo kind='mark' label='Day Flow' />, 'dark');

        const logo = screen.getByRole('img', { name: 'Day Flow' });

        expect(logo.getAttribute('data-variant')).toBe('light');
    });
});

function renderWithTheme(element: ReactNode, theme: 'dark' | 'light') {
    return render(
        <ThemeProvider attribute='class' forcedTheme={theme}>
            {element}
        </ThemeProvider>,
    );
}
