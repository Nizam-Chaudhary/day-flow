import { createContext, useContext } from 'react';

import { runMockAction } from '@/components/app-shell/mock-actions';
import { useAppShellStore } from '@/stores/app-shell-store';

type QuickAddType = 'event' | 'task';

export interface AppShellActions {
    openCommandPalette(): void;
    openQuickAdd(type?: QuickAddType): void;
    syncNow(): Promise<void>;
}

export const AppShellActionsContext = createContext<AppShellActions | null>(null);

const fallbackActions: AppShellActions = {
    openCommandPalette() {
        useAppShellStore.getState().setCommandPaletteOpen(true);
    },
    openQuickAdd() {
        useAppShellStore.getState().setQuickAddOpen(true);
    },
    async syncNow() {
        await runMockAction('Manual sync finished.');
    },
};

export function useAppShellActions(): AppShellActions {
    return useContext(AppShellActionsContext) ?? fallbackActions;
}
