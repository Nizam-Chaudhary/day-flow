import { isMatch } from 'date-fns';
import { z } from 'zod';

export const CALENDAR_VIEWS = ['day', 'week', 'month'] as const;
export const WEEK_STARTS_ON_VALUES = [0, 1] as const;

export const calendarViewSchema = z.enum(CALENDAR_VIEWS);
export const weekStartsOnSchema = z.union([z.literal(0), z.literal(1)]);
export const timeOfDaySchema = z.string().refine((value) => isMatch(value, 'HH:mm'), {
    message: 'Expected HH:mm',
});

export const appPreferencesSchema = z.object({
    defaultCalendarView: calendarViewSchema,
    weekStartsOn: weekStartsOnSchema,
    dayStartsAt: timeOfDaySchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const updateAppPreferencesInputSchema = z.object({
    defaultCalendarView: calendarViewSchema,
    weekStartsOn: weekStartsOnSchema,
    dayStartsAt: timeOfDaySchema,
});

export type CalendarView = z.infer<typeof calendarViewSchema>;
export type WeekStartsOn = z.infer<typeof weekStartsOnSchema>;
export type AppPreferences = z.infer<typeof appPreferencesSchema>;
export type UpdateAppPreferencesInput = z.infer<typeof updateAppPreferencesInputSchema>;

export const DEFAULT_APP_PREFERENCES_INPUT = updateAppPreferencesInputSchema.parse({
    defaultCalendarView: 'week',
    weekStartsOn: 1,
    dayStartsAt: '08:00',
});

export function isCalendarView(value: unknown): value is CalendarView {
    return calendarViewSchema.safeParse(value).success;
}

export function isWeekStartsOn(value: unknown): value is WeekStartsOn {
    return weekStartsOnSchema.safeParse(value).success;
}

export function isTimeOfDay(value: unknown): value is string {
    return timeOfDaySchema.safeParse(value).success;
}
