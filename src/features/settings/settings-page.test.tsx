// @vitest-environment jsdom

import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsPage } from "@/features/settings/settings-page";
import { createQueryClient } from "@/lib/query/create-query-client";
import type { DayFlowApi } from "@/preload/create-day-flow-api";

vi.mock("@tanstack/react-router", () => ({
    Link: ({
        children,
        className,
        to,
    }: {
        children: ReactNode;
        className?: string;
        to: string;
    }) => (
        <a className={className} href={to}>
            {children}
        </a>
    ),
}));

describe("SettingsPage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("loads preferences, submits updates, and invalidates the settings query", async () => {
        const getHealth = vi.fn().mockResolvedValue({
            databasePath: "/tmp/day-flow.sqlite",
            databaseReady: true,
            lastMigrationAt: "2026-04-18T00:00:00.000Z",
        });
        const getPreferences = vi
            .fn()
            .mockResolvedValueOnce({
                createdAt: "2026-04-18T00:00:00.000Z",
                dayStartsAt: "09:30",
                defaultCalendarView: "month",
                updatedAt: "2026-04-18T00:00:00.000Z",
                weekStartsOn: 0,
            })
            .mockResolvedValue({
                createdAt: "2026-04-18T00:00:00.000Z",
                dayStartsAt: "07:45",
                defaultCalendarView: "day",
                updatedAt: "2026-04-18T00:15:00.000Z",
                weekStartsOn: 1,
            });
        const updatePreferences = vi.fn().mockResolvedValue({
            createdAt: "2026-04-18T00:00:00.000Z",
            dayStartsAt: "07:45",
            defaultCalendarView: "day",
            updatedAt: "2026-04-18T00:15:00.000Z",
            weekStartsOn: 1,
        });

        window.dayFlowApi = {
            app: { getHealth },
            settings: {
                getPreferences,
                updatePreferences,
            },
        } satisfies DayFlowApi;

        renderWithQueryClient(<SettingsPage />);

        const timeInput = (await screen.findByLabelText("Day starts at")) as HTMLInputElement;

        await waitFor(() => {
            expect(timeInput.value).toBe("09:30");
        });

        fireEvent.change(timeInput, { target: { value: "07:45" } });
        await userEvent.click(screen.getByRole("button", { name: "Save preferences" }));

        await waitFor(() => {
            expect(updatePreferences).toHaveBeenCalledWith({
                dayStartsAt: "07:45",
                defaultCalendarView: "month",
                weekStartsOn: 0,
            });
        });

        await waitFor(() => {
            expect(getPreferences).toHaveBeenCalledTimes(2);
        });

        expect((screen.getByLabelText("Day starts at") as HTMLInputElement).value).toBe("07:45");
    });

    it("renders query errors", async () => {
        window.dayFlowApi = {
            app: {
                getHealth: vi.fn().mockResolvedValue({
                    databasePath: "/tmp/day-flow.sqlite",
                    databaseReady: true,
                }),
            },
            settings: {
                getPreferences: vi.fn().mockRejectedValue(new Error("Database unavailable.")),
                updatePreferences: vi.fn(),
            },
        } satisfies DayFlowApi;

        renderWithQueryClient(<SettingsPage />);

        expect((await screen.findByRole("alert")).textContent).toContain("Database unavailable.");
    });
});

function renderWithQueryClient(component: ReactNode) {
    const queryClient = createQueryClient();

    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}
