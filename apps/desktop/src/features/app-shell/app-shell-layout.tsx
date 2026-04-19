import { useQuery } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { createContext, type CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppTopbar } from '@/features/app-shell/app-topbar';
import { GlobalSearchDialog } from '@/features/app-shell/global-search-dialog';
import { runMockAction } from '@/features/app-shell/mock-actions';
import { QuickAddDialog } from '@/features/app-shell/quick-add-dialog';
import { appPreferencesQueryOptions } from '@/features/settings/settings-query-options';
import { useAppShellStore } from '@/stores/app-shell-store';

type QuickAddType = 'event' | 'task';

interface AppShellActions {
    openCommandPalette(): void;
    openQuickAdd(type?: QuickAddType): void;
    syncNow(): Promise<void>;
}

const AppShellActionsContext = createContext<AppShellActions | null>(null);

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

const sidebarStyle = {
    '--sidebar-width': '15rem',
    '--sidebar-width-mobile': '16rem',
} as CSSProperties;

export function AppShellLayout() {
    const preferencesQuery = useQuery(appPreferencesQueryOptions);
    const hasHydratedCalendarView = useRef(false);
    const [quickAddType, setQuickAddType] = useState<QuickAddType>('task');
    const isSyncInFlight = useAppShellStore((state) => state.isSyncInFlight);

    useEffect(() => {
        if (hasHydratedCalendarView.current || !preferencesQuery.data) {
            return;
        }

        useAppShellStore
            .getState()
            .setActiveCalendarView(preferencesQuery.data.defaultCalendarView);
        hasHydratedCalendarView.current = true;
    }, [preferencesQuery.data]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                useAppShellStore.getState().setCommandPaletteOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const openQuickAdd = (type: QuickAddType = 'task') => {
        setQuickAddType(type);
        useAppShellStore.getState().setQuickAddOpen(true);
    };

    const syncNow = async () => {
        if (isSyncInFlight) {
            return;
        }

        useAppShellStore.getState().setSyncInFlight(true);

        const promise = runMockAction('Everything is in sync.');

        void toast.promise(promise, {
            error: 'Sync failed.',
            loading: 'Syncing providers...',
            success: (message) => {
                useAppShellStore.getState().setLastSyncedAt(new Date().toISOString());
                return message;
            },
        });

        try {
            await promise;
        } finally {
            useAppShellStore.getState().setSyncInFlight(false);
        }
    };

    return (
        <AppShellActionsContext.Provider
            value={{
                openCommandPalette: () => {
                    useAppShellStore.getState().setCommandPaletteOpen(true);
                },
                openQuickAdd,
                syncNow,
            }}>
            <SidebarProvider defaultOpen style={sidebarStyle}>
                <AppSidebar />
                <SidebarInset>
                    <div className='flex min-h-screen max-w-full min-w-0 flex-1 flex-col overflow-x-clip'>
                        <AppTopbar onOpenQuickAdd={openQuickAdd} onSyncNow={syncNow} />

                        <main className='max-w-full min-w-0 flex-1 overflow-x-clip px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pt-8'>
                            <div className='mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6'>
                                <Outlet />
                            </div>
                        </main>
                    </div>
                </SidebarInset>
                <GlobalSearchDialog onOpenQuickAdd={openQuickAdd} onSyncNow={syncNow} />
                <QuickAddDialog initialType={quickAddType} />
            </SidebarProvider>
        </AppShellActionsContext.Provider>
    );
}
