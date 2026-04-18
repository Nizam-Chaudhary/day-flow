import { BrowserWindow } from "electron";
import { join } from "node:path";

export async function createMainWindow(): Promise<void> {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
            preload: join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.removeMenu();

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        return;
    }

    await mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
}
