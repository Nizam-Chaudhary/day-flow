import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (typeof window !== 'undefined') {
    if (!window.matchMedia) {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: (query: string) => ({
                addEventListener: () => {},
                addListener: () => {},
                dispatchEvent: () => false,
                matches: false,
                media: query,
                onchange: null,
                removeEventListener: () => {},
                removeListener: () => {},
            }),
        });
    }

    Object.defineProperty(window, 'scrollTo', {
        configurable: true,
        value: () => {},
    });

    if (!HTMLElement.prototype.scrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: () => {},
        });
    }

    if (!window.ResizeObserver) {
        class MockResizeObserver {
            disconnect() {}

            observe() {}

            unobserve() {}
        }

        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: MockResizeObserver,
        });
        Object.defineProperty(globalThis, 'ResizeObserver', {
            configurable: true,
            value: MockResizeObserver,
        });
    }
}

afterEach(() => {
    cleanup();
});
