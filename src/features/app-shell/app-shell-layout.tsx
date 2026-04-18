import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "@/features/app-shell/app-sidebar";
import { AppTopbar } from "@/features/app-shell/app-topbar";
import { GlobalSearchDialog } from "@/features/app-shell/global-search-dialog";
import { QuickAddDialog } from "@/features/app-shell/quick-add-dialog";
import { runMockAction } from "@/features/app-shell/mock-actions";
import { appPreferencesQueryOptions } from "@/features/settings/settings-query-options";
import { useAppShellStore } from "@/stores/app-shell-store";

type QuickAddType = "event" | "task";

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
        await runMockAction("Manual sync finished.");
    },
};

export function useAppShellActions(): AppShellActions {
    return useContext(AppShellActionsContext) ?? fallbackActions;
}

export function AppShellLayout() {
    const preferencesQuery = useQuery(appPreferencesQueryOptions);
    const hasHydratedCalendarView = useRef(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState<QuickAddType>("task");
    const {
        isSyncInFlight,
        setActiveCalendarView,
        setCommandPaletteOpen,
        setLastSyncedAt,
        setQuickAddOpen,
        setSyncInFlight,
    } = useAppShellStore(
        useShallow((state) => ({
            isSyncInFlight: state.isSyncInFlight,
            setActiveCalendarView: state.setActiveCalendarView,
            setCommandPaletteOpen: state.setCommandPaletteOpen,
            setLastSyncedAt: state.setLastSyncedAt,
            setQuickAddOpen: state.setQuickAddOpen,
            setSyncInFlight: state.setSyncInFlight,
        })),
    );

    useEffect(() => {
        if (hasHydratedCalendarView.current || !preferencesQuery.data) {
            return;
        }

        setActiveCalendarView(preferencesQuery.data.defaultCalendarView);
        hasHydratedCalendarView.current = true;
    }, [preferencesQuery.data, setActiveCalendarView]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setCommandPaletteOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [setCommandPaletteOpen]);

    const openQuickAdd = (type: QuickAddType = "task") => {
        setQuickAddType(type);
        setQuickAddOpen(true);
    };

    const syncNow = async () => {
        if (isSyncInFlight) {
            return;
        }

        setSyncInFlight(true);

        const promise = runMockAction("Everything is in sync.");

        void toast.promise(promise, {
            error: "Sync failed.",
            loading: "Syncing providers...",
            success: (message) => {
                setLastSyncedAt(new Date().toISOString());
                return message;
            },
        });

        try {
            await promise;
        } finally {
            setSyncInFlight(false);
        }
    };

    return (
        <AppShellActionsContext.Provider
            value={{
                openCommandPalette: () => {
                    setCommandPaletteOpen(true);
                },
                openQuickAdd,
                syncNow,
            }}
        >
            <div className="min-h-screen">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute inset-x-0 top-[-14rem] h-[28rem] bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_16%,transparent),transparent_62%)]" />
                    <div className="absolute inset-y-0 right-[-8rem] w-[24rem] bg-[radial-gradient(circle_at_center,_color-mix(in_oklch,var(--muted-foreground)_10%,transparent),transparent_68%)]" />
                </div>

                <div className="relative flex min-h-screen">
                    <aside className="bg-sidebar/80 hidden w-72 shrink-0 border-r px-5 py-6 backdrop-blur-xl lg:flex">
                        <div className="sticky top-6 h-[calc(100vh-3rem)] w-full">
                            <AppSidebar />
                        </div>
                    </aside>

                    <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
                        <AppTopbar
                            onOpenMobileNav={() => {
                                setIsMobileNavOpen(true);
                            }}
                            onOpenQuickAdd={openQuickAdd}
                            onSyncNow={syncNow}
                        />

                        <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pt-8">
                            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                                <Outlet />
                            </div>
                        </main>
                    </div>
                </div>

                <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                    <SheetContent className="w-full sm:max-w-sm" side="left">
                        <SheetHeader>
                            <SheetTitle>Navigation</SheetTitle>
                        </SheetHeader>
                        <div className="px-6 pb-6">
                            <AppSidebar
                                mode="mobile"
                                onNavigate={() => {
                                    setIsMobileNavOpen(false);
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>

                <GlobalSearchDialog onOpenQuickAdd={openQuickAdd} onSyncNow={syncNow} />
                <QuickAddDialog initialType={quickAddType} />
            </div>
        </AppShellActionsContext.Provider>
    );
}
