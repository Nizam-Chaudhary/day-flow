import { app, BrowserWindow } from "electron";
import squirrelStartup from "electron-squirrel-startup";

import { bootstrapMainProcess } from "@/main/app/bootstrap";
import { createMainWindow } from "@/main/windows/create-main-window";

if (squirrelStartup) {
    app.quit();
}

void app.whenReady().then(async () => {
    await bootstrapMainProcess();
    await createMainWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            void createMainWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
