import { isMatch } from 'date-fns';

export const CALENDAR_VIEWS = ['day', 'week', 'month'] as const;
export const WEEK_STARTS_ON_VALUES = [0, 1] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];
export type WeekStartsOn = (typeof WEEK_STARTS_ON_VALUES)[number];

export interface AppPreferences {
    defaultCalendarView: CalendarView;
    weekStartsOn: WeekStartsOn;
    dayStartsAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateAppPreferencesInput {
    defaultCalendarView: CalendarView;
    weekStartsOn: WeekStartsOn;
    dayStartsAt: string;
}

export const DEFAULT_APP_PREFERENCES_INPUT = {
    defaultCalendarView: 'week',
    weekStartsOn: 1,
    dayStartsAt: '08:00',
} as const satisfies UpdateAppPreferencesInput;

export function isCalendarView(value: unknown): value is CalendarView {
    return typeof value === 'string' && CALENDAR_VIEWS.includes(value as CalendarView);
}

export function isWeekStartsOn(value: unknown): value is WeekStartsOn {
    return value === 0 || value === 1;
}

export function isTimeOfDay(value: unknown): value is string {
    return typeof value === 'string' && isMatch(value, 'HH:mm');
}
