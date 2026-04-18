import { format, subMinutes } from "date-fns";
import { create } from "zustand";

import type { CalendarView } from "@/shared/contracts/settings";

export interface AppShellState {
    activeCalendarView: CalendarView;
    isCommandPaletteOpen: boolean;
    isNotificationsOpen: boolean;
    isQuickAddOpen: boolean;
    isSyncInFlight: boolean;
    lastSyncedAt: string | null;
    selectedDate: string;
    setActiveCalendarView(view: CalendarView): void;
    setCommandPaletteOpen(isOpen: boolean): void;
    setLastSyncedAt(value: string | null): void;
    setNotificationsOpen(isOpen: boolean): void;
    setQuickAddOpen(isOpen: boolean): void;
    setSelectedDate(date: string): void;
    setSyncInFlight(isInFlight: boolean): void;
}

export const useAppShellStore = create<AppShellState>()((set) => ({
    activeCalendarView: "week",
    isCommandPaletteOpen: false,
    isNotificationsOpen: false,
    isQuickAddOpen: false,
    isSyncInFlight: false,
    lastSyncedAt: subMinutes(new Date(), 12).toISOString(),
    selectedDate: format(new Date(), "yyyy-MM-dd"),
    setActiveCalendarView: (activeCalendarView) => {
        set({ activeCalendarView });
    },
    setCommandPaletteOpen: (isCommandPaletteOpen) => {
        set({ isCommandPaletteOpen });
    },
    setLastSyncedAt: (lastSyncedAt) => {
        set({ lastSyncedAt });
    },
    setNotificationsOpen: (isNotificationsOpen) => {
        set({ isNotificationsOpen });
    },
    setQuickAddOpen: (isQuickAddOpen) => {
        set({ isQuickAddOpen });
    },
    setSelectedDate: (selectedDate) => {
        set({ selectedDate });
    },
    setSyncInFlight: (isSyncInFlight) => {
        set({ isSyncInFlight });
    },
}));

export const appShellSelectors = {
    activeCalendarView: (state: AppShellState) => state.activeCalendarView,
    isCommandPaletteOpen: (state: AppShellState) => state.isCommandPaletteOpen,
    isNotificationsOpen: (state: AppShellState) => state.isNotificationsOpen,
    isQuickAddOpen: (state: AppShellState) => state.isQuickAddOpen,
    isSyncInFlight: (state: AppShellState) => state.isSyncInFlight,
    lastSyncedAt: (state: AppShellState) => state.lastSyncedAt,
    selectedDate: (state: AppShellState) => state.selectedDate,
};

export function resetAppShellStore(): void {
    useAppShellStore.setState({
        activeCalendarView: "week",
        isCommandPaletteOpen: false,
        isNotificationsOpen: false,
        isQuickAddOpen: false,
        isSyncInFlight: false,
        lastSyncedAt: subMinutes(new Date(), 12).toISOString(),
        selectedDate: format(new Date(), "yyyy-MM-dd"),
    });
}
