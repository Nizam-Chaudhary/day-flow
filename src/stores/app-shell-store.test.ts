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
        expect(appShellSelectors.isQuickAddOpen(initialState)).toBe(false);
        expect(appShellSelectors.isNotificationsOpen(initialState)).toBe(false);
        expect(appShellSelectors.isSyncInFlight(initialState)).toBe(false);
        expect(appShellSelectors.lastSyncedAt(initialState)).toBeTruthy();

        initialState.setActiveCalendarView("month");
        initialState.setCommandPaletteOpen(true);
        initialState.setQuickAddOpen(true);
        initialState.setNotificationsOpen(true);
        initialState.setSelectedDate("2026-04-18");
        initialState.setSyncInFlight(true);
        initialState.setLastSyncedAt("2026-04-18T12:00:00.000Z");

        const updatedState = useAppShellStore.getState();

        expect(appShellSelectors.activeCalendarView(updatedState)).toBe("month");
        expect(appShellSelectors.isCommandPaletteOpen(updatedState)).toBe(true);
        expect(appShellSelectors.isQuickAddOpen(updatedState)).toBe(true);
        expect(appShellSelectors.isNotificationsOpen(updatedState)).toBe(true);
        expect(appShellSelectors.isSyncInFlight(updatedState)).toBe(true);
        expect(appShellSelectors.lastSyncedAt(updatedState)).toBe("2026-04-18T12:00:00.000Z");
        expect(appShellSelectors.selectedDate(updatedState)).toBe("2026-04-18");
    });
});
