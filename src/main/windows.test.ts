import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const browserWindowInstances: BrowserWindowStub[] = [];
const envState = {
    DAY_FLOW_OPEN_DEVTOOLS: false,
};

class BrowserWindowStub {
    loadFile = vi.fn<() => Promise<void>>(async () => undefined);
    loadURL = vi.fn<() => Promise<void>>(async () => undefined);
    once = vi.fn<(event: string, listener: () => void) => void>((event, listener) => {
        if (event === 'ready-to-show') {
            listener();
        }
    });
    removeMenu = vi.fn<() => void>();
    setMenuBarVisibility = vi.fn<(visible: boolean) => void>();
    show = vi.fn<() => void>();
    webContents = {
        closeDevTools: vi.fn<() => void>(),
        isDevToolsOpened: vi.fn<() => boolean>(() => false),
        on: vi.fn<(event: string, listener: (...args: unknown[]) => void) => void>(),
        openDevTools: vi.fn<(options?: { mode: 'bottom' | 'detach' | 'left' | 'right' }) => void>(),
    };

    constructor() {
        browserWindowInstances.push(this);
    }
}

vi.mock('@/lib/env', () => ({
    env: envState,
}));

vi.mock('electron', () => ({
    BrowserWindow: BrowserWindowStub,
}));

beforeEach(() => {
    browserWindowInstances.length = 0;
    envState.DAY_FLOW_OPEN_DEVTOOLS = false;
    vi.resetModules();
    vi.stubGlobal('MAIN_WINDOW_VITE_DEV_SERVER_URL', 'http://127.0.0.1:3000');
    vi.stubGlobal('MAIN_WINDOW_VITE_NAME', 'main_window');
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('createMainWindow', () => {
    it('opens devtools on startup when enabled', async () => {
        envState.DAY_FLOW_OPEN_DEVTOOLS = true;

        const { createMainWindow } = await import('@/main/windows');

        await createMainWindow();

        expect(browserWindowInstances[0]?.webContents.openDevTools).toHaveBeenCalledWith({
            mode: 'detach',
        });
    });

    it('does not open devtools on startup when disabled', async () => {
        const { createMainWindow } = await import('@/main/windows');

        await createMainWindow();

        expect(browserWindowInstances[0]?.webContents.openDevTools).not.toHaveBeenCalled();
    });
});
