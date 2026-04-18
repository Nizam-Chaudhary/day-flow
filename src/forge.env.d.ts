/// <reference types="vite/client" />

interface ElectronAppInfo {
    platform: NodeJS.Platform;
    versions: {
        electron: string;
        chrome: string;
        node: string;
    };
}

declare global {
    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
    const MAIN_WINDOW_VITE_NAME: string;

    interface Window {
        electronApp: ElectronAppInfo;
    }
}

export {};
