import '@day-flow/env/index';
import { app, BrowserWindow } from 'electron';
import squirrelStartup from 'electron-squirrel-startup';

import { bootstrapMainProcess } from '@/main/app/bootstrap';
import { configureLinuxGraphicsPlatform } from '@/main/platform/configure-linux-graphics-platform';
import { createMainWindow } from '@/main/windows/create-main-window';

if (squirrelStartup) {
    app.quit();
}

configureLinuxGraphicsPlatform();

void app.whenReady().then(async () => {
    await bootstrapMainProcess();
    await createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            void createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
