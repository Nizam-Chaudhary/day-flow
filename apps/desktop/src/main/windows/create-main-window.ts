import { BrowserWindow } from 'electron';
import { join } from 'node:path';

export async function createMainWindow(): Promise<void> {
    const iconPath = getWindowIconPath();
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        ...(iconPath ? { icon: iconPath } : {}),
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.removeMenu();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        return;
    }

    await mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
}

function getWindowIconPath(): string | undefined {
    if (process.platform === 'darwin') {
        return undefined;
    }

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        return join(process.cwd(), '../../assets/icons/day-flow_1024x1024.png');
    }

    return join(process.resourcesPath, 'assets/icons/day-flow_1024x1024.png');
}
