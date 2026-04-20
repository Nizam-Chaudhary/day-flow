import '@/lib/env';
import { app, BrowserWindow } from 'electron';
import squirrelStartup from 'electron-squirrel-startup';

import { bootstrapMainProcess } from '@/main/bootstrap';
import { configureLinuxGraphicsPlatform } from '@/main/platform';
import { createMainWindow } from '@/main/windows';

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
