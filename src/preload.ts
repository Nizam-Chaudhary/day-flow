import { contextBridge } from "electron";

const electronApp = Object.freeze({
    platform: process.platform,
    versions: Object.freeze({
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
    }),
});

contextBridge.exposeInMainWorld("electronApp", electronApp);
