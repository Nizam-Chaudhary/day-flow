import { describe, expect, it, vi } from "vitest";

import { createIpcHandlers } from "@/main/ipc/register-ipc";
import {
    APP_GET_HEALTH_CHANNEL,
    SETTINGS_GET_CHANNEL,
    SETTINGS_UPDATE_CHANNEL,
} from "@/shared/channels";
import { createDayFlowError } from "@/shared/errors";

describe("createIpcHandlers", () => {
    it("wraps successful responses in the shared IPC result shape", async () => {
        const handlers = createIpcHandlers({
            getHealth: () => ({
                databasePath: "/tmp/day-flow.sqlite",
                databaseReady: true,
                lastMigrationAt: "2026-04-18T00:00:00.000Z",
            }),
            settingsService: {
                getPreferences: vi.fn(() => ({
                    createdAt: "2026-04-18T00:00:00.000Z",
                    dayStartsAt: "08:00",
                    defaultCalendarView: "week",
                    updatedAt: "2026-04-18T00:00:00.000Z",
                    weekStartsOn: 1,
                })),
                updatePreferences: vi.fn((input) => ({
                    createdAt: "2026-04-18T00:00:00.000Z",
                    updatedAt: "2026-04-18T00:00:01.000Z",
                    ...input,
                })),
            },
        });

        await expect(handlers[APP_GET_HEALTH_CHANNEL]({} as never)).resolves.toEqual({
            data: {
                databasePath: "/tmp/day-flow.sqlite",
                databaseReady: true,
                lastMigrationAt: "2026-04-18T00:00:00.000Z",
            },
            ok: true,
        });

        await expect(handlers[SETTINGS_GET_CHANNEL]({} as never)).resolves.toEqual({
            data: {
                createdAt: "2026-04-18T00:00:00.000Z",
                dayStartsAt: "08:00",
                defaultCalendarView: "week",
                updatedAt: "2026-04-18T00:00:00.000Z",
                weekStartsOn: 1,
            },
            ok: true,
        });

        await expect(
            handlers[SETTINGS_UPDATE_CHANNEL]({} as never, {
                dayStartsAt: "09:00",
                defaultCalendarView: "day",
                weekStartsOn: 0,
            }),
        ).resolves.toEqual({
            data: {
                createdAt: "2026-04-18T00:00:00.000Z",
                dayStartsAt: "09:00",
                defaultCalendarView: "day",
                updatedAt: "2026-04-18T00:00:01.000Z",
                weekStartsOn: 0,
            },
            ok: true,
        });
    });

    it("serializes service failures into safe errors", async () => {
        const handlers = createIpcHandlers({
            settingsService: {
                getPreferences: vi.fn(() => {
                    throw createDayFlowError("INVALID_INPUT", "Broken settings payload.");
                }),
                updatePreferences: vi.fn(),
            },
        });

        await expect(handlers[SETTINGS_GET_CHANNEL]({} as never)).resolves.toEqual({
            error: {
                code: "INVALID_INPUT",
                message: "Broken settings payload.",
            },
            ok: false,
        });
    });
});
