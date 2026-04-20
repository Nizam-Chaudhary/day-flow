import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

vi.mock('dotenv', () => ({
    default: {
        config: vi.fn<() => void>(),
    },
}));

beforeEach(() => {
    vi.resetModules();
    process.env = {
        ...ORIGINAL_ENV,
    };
});

afterEach(() => {
    process.env = {
        ...ORIGINAL_ENV,
    };
});

describe('env', () => {
    it('parses required Google client ID and applies defaults', async () => {
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        delete process.env.GOOGLE_CLIENT_SECRET;
        delete process.env.DAY_FLOW_AUTH_HOST;
        delete process.env.DAY_FLOW_AUTH_PORT;
        delete process.env.DAY_FLOW_OPEN_DEVTOOLS;
        delete process.env.DAY_FLOW_WAYLAND_COLOR_MANAGER;

        const { env } = await import('./env');

        expect(env.GOOGLE_CLIENT_ID).toBe('client-id');
        expect(env.GOOGLE_CLIENT_SECRET).toBeUndefined();
        expect(env.DAY_FLOW_AUTH_HOST).toBe('127.0.0.1');
        expect(env.DAY_FLOW_AUTH_PORT).toBe(0);
        expect(env.DAY_FLOW_OPEN_DEVTOOLS).toBe(false);
        expect(env.DAY_FLOW_WAYLAND_COLOR_MANAGER).toBe(false);
    });

    it.each([
        ['true', true],
        ['TRUE', true],
        ['1', true],
        ['false', false],
        ['FALSE', false],
        ['0', false],
    ])('parses boolean value %s', async (value, expected) => {
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        process.env.DAY_FLOW_OPEN_DEVTOOLS = value;

        const { env } = await import('./env');

        expect(env.DAY_FLOW_OPEN_DEVTOOLS).toBe(expected);
    });

    it('treats empty strings as undefined and applies defaults', async () => {
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        process.env.DAY_FLOW_AUTH_HOST = '';
        process.env.DAY_FLOW_AUTH_PORT = '';
        process.env.DAY_FLOW_OPEN_DEVTOOLS = '';

        const { env } = await import('./env');

        expect(env.DAY_FLOW_AUTH_HOST).toBe('127.0.0.1');
        expect(env.DAY_FLOW_AUTH_PORT).toBe(0);
        expect(env.DAY_FLOW_OPEN_DEVTOOLS).toBe(false);
    });

    it('rejects invalid boolean values', async () => {
        process.env.GOOGLE_CLIENT_ID = 'client-id';
        process.env.DAY_FLOW_OPEN_DEVTOOLS = 'yes';

        await expect(import('./env')).rejects.toThrow('Invalid environment variables');
    });
});
