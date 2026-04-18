import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { CALENDAR_VIEWS } from "@/shared/contracts/settings";

export const appPreferencesTable = sqliteTable(
    "app_preferences",
    {
        id: integer("id").primaryKey(),
        defaultCalendarView: text("default_calendar_view", {
            enum: CALENDAR_VIEWS,
        }).notNull(),
        weekStartsOn: integer("week_starts_on").$type<0 | 1>().notNull(),
        dayStartsAt: text("day_starts_at").notNull(),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
    },
    (table) => [
        check("app_preferences_singleton_check", sql`${table.id} = 1`),
        check("app_preferences_week_starts_on_check", sql`${table.weekStartsOn} in (0, 1)`),
        check(
            "app_preferences_calendar_view_check",
            sql`${table.defaultCalendarView} in ('day', 'week', 'month')`,
        ),
    ],
);

export type AppPreferencesRow = typeof appPreferencesTable.$inferSelect;
