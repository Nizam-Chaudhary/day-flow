// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { describe, expect, it } from 'vitest';

import { IntegrationLogo } from '@/components/integrations/integration-logo';

describe('IntegrationLogo', () => {
    it('keeps the Apple logo theme-aware in light mode', () => {
        renderWithTheme(<IntegrationLogo logoKey='apple' name='Apple Calendar' />, 'light');

        const frame = screen.getByTestId('integration-logo-apple');
        const image = screen.getByRole('img', { name: 'Apple Calendar logo' });

        expect(frame.getAttribute('data-theme-variant')).toBe('light');
        expect(image.className).not.toContain('invert');
    });

    it('keeps the Apple logo theme-aware in dark mode', () => {
        renderWithTheme(<IntegrationLogo logoKey='apple' name='Apple Calendar' />, 'dark');

        const frame = screen.getByTestId('integration-logo-apple');
        const image = screen.getByRole('img', { name: 'Apple Calendar logo' });

        expect(frame.getAttribute('data-theme-variant')).toBe('dark');
        expect(image.className).toContain('invert');
    });

    it('keeps the Notion logo theme-aware in light mode', () => {
        renderWithTheme(<IntegrationLogo logoKey='notion' name='Notion' />, 'light');

        const frame = screen.getByTestId('integration-logo-notion');
        const image = screen.getByRole('img', { name: 'Notion logo' });

        expect(frame.getAttribute('data-theme-variant')).toBe('light');
        expect(image.className).not.toContain('invert');
    });

    it('keeps the Notion logo theme-aware in dark mode', () => {
        renderWithTheme(<IntegrationLogo logoKey='notion' name='Notion' />, 'dark');

        const frame = screen.getByTestId('integration-logo-notion');
        const image = screen.getByRole('img', { name: 'Notion logo' });

        expect(frame.getAttribute('data-theme-variant')).toBe('dark');
        expect(image.className).toContain('invert');
    });
});

function renderWithTheme(element: ReactNode, theme: 'dark' | 'light') {
    return render(
        <ThemeProvider attribute='class' forcedTheme={theme}>
            {element}
        </ThemeProvider>,
    );
}
