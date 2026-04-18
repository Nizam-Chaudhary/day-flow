// @vitest-environment jsdom

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DayFlowApi } from "@/preload/create-day-flow-api";

import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/query/create-query-client";
import { routeTree } from "@/routeTree.gen";
import { resetAppShellStore } from "@/stores/app-shell-store";

describe("App shell routes", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        resetAppShellStore();
        setViewportWidth(1280);
        mockMatchMedia();
        window.dayFlowApi = createDayFlowApi();
    });

    afterEach(() => {
        vi.useRealTimers();
        setViewportWidth(1280);
    });

    it.each([
        ["/", "Today"],
        ["/calendar", "Calendar"],
        ["/tasks", "Tasks"],
        ["/reminders", "Reminders"],
        ["/notes", "Notes"],
        ["/integrations", "Integrations"],
        ["/settings", "Settings"],
    ])("renders %s inside the app shell", async (path, heading) => {
        renderApp(path);

        expect(await screen.findByRole("heading", { name: heading })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Open global search" })).toBeTruthy();
    });

    it("opens and closes the global search dialog", async () => {
        const user = userEvent.setup();

        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(await screen.findByRole("button", { name: "Open global search" }));

        expect(
            await screen.findByPlaceholderText("Search routes, actions, or areas..."),
        ).toBeTruthy();

        await user.keyboard("{Escape}");

        await waitFor(() => {
            expect(screen.queryByPlaceholderText("Search routes, actions, or areas...")).toBeNull();
        });
    });

    it("opens and submits the quick-add dialog", async () => {
        const user = userEvent.setup();

        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(await screen.findByRole("button", { name: "Open quick add" }));
        expect(await screen.findByRole("heading", { name: "Quick add" })).toBeTruthy();

        await user.type(screen.getByLabelText("Title"), "Capture route scaffolding");
        await user.click(screen.getByRole("button", { name: "Save quick add" }));

        await waitFor(
            () => {
                expect(screen.queryByRole("heading", { name: "Quick add" })).toBeNull();
            },
            { timeout: 2500 },
        );
    });

    it("navigates between sidebar items", async () => {
        const user = userEvent.setup();

        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(await screen.findByRole("link", { name: /Calendar/i }));

        expect(await screen.findByRole("heading", { name: "Calendar" })).toBeTruthy();
    });

    it("renders the sidebar brand as a non-clickable item", async () => {
        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        expect(screen.getByText("Day Flow")).toBeTruthy();
        expect(screen.queryByRole("link", { name: "Day Flow" })).toBeNull();
    });

    it("opens the event detail sheet from the calendar page", async () => {
        const user = userEvent.setup();

        renderApp("/calendar");
        await screen.findByRole("heading", { name: "Calendar" });

        await user.click(await screen.findByRole("button", { name: "Open event Launch standup" }));

        expect(await screen.findByRole("heading", { name: "Launch standup" })).toBeTruthy();
    });

    it("opens the task detail sheet from the tasks page", async () => {
        const user = userEvent.setup();

        renderApp("/tasks");
        await screen.findByRole("heading", { name: "Tasks" });

        await user.click(
            await screen.findByRole("button", { name: "Open task Prepare blocker digest" }),
        );

        expect(await screen.findByRole("heading", { name: "Prepare blocker digest" })).toBeTruthy();
    });

    it("toggles the desktop sidebar from the header", async () => {
        const user = userEvent.setup();

        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        const sidebar = document.querySelector('[data-slot="sidebar"][data-state="expanded"]');

        expect(sidebar).toBeTruthy();
        expect(sidebar?.getAttribute("data-state")).toBe("expanded");

        await user.click(screen.getByRole("button", { name: "Toggle sidebar" }));

        await waitFor(() => {
            expect(sidebar?.getAttribute("data-state")).toBe("collapsed");
            expect(sidebar?.getAttribute("data-collapsible")).toBe("icon");
        });
    });

    it("keeps settings only in the footer navigation", async () => {
        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        const primaryNav = screen.getByRole("navigation", { name: "Primary" });
        const preferencesNav = screen.getByRole("navigation", { name: "Preferences" });

        expect(within(primaryNav).queryByRole("link", { name: "Settings" })).toBeNull();
        expect(within(preferencesNav).getByRole("link", { name: "Settings" })).toBeTruthy();
        expect(screen.queryByRole("link", { name: /Task execution lane/i })).toBeNull();
    });

    it("keeps settings searchable in the command palette", async () => {
        const user = userEvent.setup();

        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(screen.getByRole("button", { name: "Open global search" }));

        const dialog = await screen.findByRole("dialog");

        expect(within(dialog).getByText("Settings")).toBeTruthy();
        expect(within(dialog).getByText("Preferences and diagnostics")).toBeTruthy();
    });

    it("opens the mobile sidebar from the header toggle", async () => {
        const user = userEvent.setup();

        setViewportWidth(767);
        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(await screen.findByRole("button", { name: "Toggle sidebar" }));

        const dialog = await screen.findByRole("dialog");

        expect(within(dialog).getByRole("link", { name: "Tasks" })).toBeTruthy();
    });

    it("closes the mobile sidebar after selecting a nav item", async () => {
        const user = userEvent.setup();

        setViewportWidth(767);
        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(await screen.findByRole("button", { name: "Toggle sidebar" }));

        const dialog = await screen.findByRole("dialog");

        await user.click(within(dialog).getByRole("link", { name: "Tasks" }));

        expect(await screen.findByRole("heading", { name: "Tasks" })).toBeTruthy();

        await waitFor(() => {
            expect(screen.queryByRole("dialog")).toBeNull();
        });
    });
});

function mockMatchMedia() {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query === "(max-width: 767px)" ? window.innerWidth < 768 : false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: width,
    });
}

function createDayFlowApi(): DayFlowApi {
    return {
        app: {
            getHealth: vi.fn().mockResolvedValue({
                databasePath: "/tmp/day-flow.sqlite",
                databaseReady: true,
                lastMigrationAt: "2026-04-18T00:00:00.000Z",
            }),
        },
        settings: {
            getPreferences: vi.fn().mockResolvedValue({
                createdAt: "2026-04-18T00:00:00.000Z",
                dayStartsAt: "08:00",
                defaultCalendarView: "week",
                updatedAt: "2026-04-18T00:15:00.000Z",
                weekStartsOn: 1,
            }),
            updatePreferences: vi.fn().mockResolvedValue({
                createdAt: "2026-04-18T00:00:00.000Z",
                dayStartsAt: "08:00",
                defaultCalendarView: "week",
                updatedAt: "2026-04-18T00:15:00.000Z",
                weekStartsOn: 1,
            }),
        },
    } satisfies DayFlowApi;
}

function renderApp(initialPath: string) {
    const history = createMemoryHistory({
        initialEntries: [initialPath],
    });
    const queryClient = createQueryClient();
    const router = createRouter({
        history,
        routeTree,
    });

    return render(
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster />
            </QueryClientProvider>
        </ThemeProvider>,
    );
}
