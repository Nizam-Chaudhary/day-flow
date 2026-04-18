import { beforeEach, describe, expect, it } from "vitest";

import { appShellSelectors, resetAppShellStore, useAppShellStore } from "@/stores/app-shell-store";

describe("useAppShellStore", () => {
    beforeEach(() => {
        resetAppShellStore();
    });

    it("updates shell-only state through explicit actions", () => {
        const initialState = useAppShellStore.getState();

        expect(appShellSelectors.activeCalendarView(initialState)).toBe("week");
        expect(appShellSelectors.isCommandPaletteOpen(initialState)).toBe(false);

        initialState.setActiveCalendarView("month");
        initialState.setCommandPaletteOpen(true);
        initialState.setSelectedDate("2026-04-18");

        const updatedState = useAppShellStore.getState();

        expect(appShellSelectors.activeCalendarView(updatedState)).toBe("month");
        expect(appShellSelectors.isCommandPaletteOpen(updatedState)).toBe(true);
        expect(appShellSelectors.selectedDate(updatedState)).toBe("2026-04-18");
    });
});
