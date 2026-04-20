import { app } from 'electron';

import { resolveElectronUserDataPath } from '@/db/storage-paths';

export function configureUserDataPath(): void {
    app.setPath('userData', resolveElectronUserDataPath(app.getPath('userData')));
}
