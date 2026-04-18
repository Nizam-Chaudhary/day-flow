import { format } from "date-fns";
import { create } from "zustand";

import type { CalendarView } from "@/shared/contracts/settings";

export interface AppShellState {
    activeCalendarView: CalendarView;
    isCommandPaletteOpen: boolean;
    selectedDate: string;
    setActiveCalendarView(view: CalendarView): void;
    setCommandPaletteOpen(isOpen: boolean): void;
    setSelectedDate(date: string): void;
}

export const useAppShellStore = create<AppShellState>()((set) => ({
    activeCalendarView: "week",
    isCommandPaletteOpen: false,
    selectedDate: format(new Date(), "yyyy-MM-dd"),
    setActiveCalendarView: (activeCalendarView) => {
        set({ activeCalendarView });
    },
    setCommandPaletteOpen: (isCommandPaletteOpen) => {
        set({ isCommandPaletteOpen });
    },
    setSelectedDate: (selectedDate) => {
        set({ selectedDate });
    },
}));

export const appShellSelectors = {
    activeCalendarView: (state: AppShellState) => state.activeCalendarView,
    isCommandPaletteOpen: (state: AppShellState) => state.isCommandPaletteOpen,
    selectedDate: (state: AppShellState) => state.selectedDate,
};

export function resetAppShellStore(): void {
    useAppShellStore.setState({
        activeCalendarView: "week",
        isCommandPaletteOpen: false,
        selectedDate: format(new Date(), "yyyy-MM-dd"),
    });
}
