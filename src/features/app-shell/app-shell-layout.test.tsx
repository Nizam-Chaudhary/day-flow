// @vitest-environment jsdom

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/query/create-query-client";
import type { DayFlowApi } from "@/preload/create-day-flow-api";
import { routeTree } from "@/routeTree.gen";
import { resetAppShellStore } from "@/stores/app-shell-store";

describe("App shell routes", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        resetAppShellStore();
        window.dayFlowApi = createDayFlowApi();
    });

    afterEach(() => {
        vi.useRealTimers();
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

    it("shows the mobile navigation sheet", async () => {
        const user = userEvent.setup();

        renderApp("/");
        await screen.findByRole("heading", { name: "Today" });

        await user.click(await screen.findByRole("button", { name: "Open navigation" }));

        expect(await screen.findByRole("heading", { name: "Navigation" })).toBeTruthy();
        expect(screen.getByRole("link", { name: /TasksTask execution lane/i })).toBeTruthy();
    });
});

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
