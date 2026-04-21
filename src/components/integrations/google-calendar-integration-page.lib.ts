import type {
    GoogleCalendarColorType,
    GoogleCalendarSummary,
    UpdateGoogleCalendarInput,
} from '@/schemas/contracts/google-calendar';

import { normalizeGoogleCalendarColor } from '@/lib/google-calendar-colors';
import { GOOGLE_REMINDER_LEAD_OPTIONS } from '@/schemas/contracts/google-calendar';

export interface CalendarFormValues {
    calendarColorType: GoogleCalendarColorType;
    colorOverride: string;
    isSelected: boolean;
    reminderEnabled: boolean;
    reminderLeadMinutesList: GoogleCalendarSummary['reminderLeadMinutesList'];
    syncEnabled: boolean;
    syncIntervalMinutes: GoogleCalendarSummary['syncIntervalMinutes'];
}

export function getCalendarFormValues(calendar: GoogleCalendarSummary): CalendarFormValues {
    return {
        calendarColorType: calendar.calendarColorType,
        colorOverride: normalizeGoogleCalendarColor(
            calendar.colorOverride ?? calendar.effectiveColor,
        ),
        isSelected: calendar.isSelected,
        reminderEnabled: calendar.reminderEnabled,
        reminderLeadMinutesList: normalizeReminderLeadMinutesList(calendar.reminderLeadMinutesList),
        syncEnabled: calendar.syncEnabled,
        syncIntervalMinutes: calendar.syncIntervalMinutes,
    };
}

export function buildGoogleCalendarUpdateInput(
    previousValues: CalendarFormValues,
    nextValues: CalendarFormValues,
    calendarId: string,
): UpdateGoogleCalendarInput | null {
    const updateInput: UpdateGoogleCalendarInput = {
        calendarId,
    };

    if (previousValues.isSelected !== nextValues.isSelected) {
        updateInput.isSelected = nextValues.isSelected;
    }

    if (previousValues.syncEnabled !== nextValues.syncEnabled) {
        updateInput.syncEnabled = nextValues.syncEnabled;
    }

    if (previousValues.syncIntervalMinutes !== nextValues.syncIntervalMinutes) {
        updateInput.syncIntervalMinutes = nextValues.syncIntervalMinutes;
    }

    if (previousValues.reminderEnabled !== nextValues.reminderEnabled) {
        updateInput.reminderEnabled = nextValues.reminderEnabled;
        updateInput.reminderChannel = 'in_app';
    }

    if (
        !areReminderLeadMinutesListsEqual(
            previousValues.reminderLeadMinutesList,
            nextValues.reminderLeadMinutesList,
        )
    ) {
        updateInput.reminderLeadMinutesList = normalizeReminderLeadMinutesList(
            nextValues.reminderLeadMinutesList,
        );
        updateInput.reminderChannel = 'in_app';
    }

    if (previousValues.calendarColorType !== nextValues.calendarColorType) {
        updateInput.calendarColorType = nextValues.calendarColorType;
    }

    const normalizedNextColor = normalizeGoogleCalendarColor(nextValues.colorOverride);
    const normalizedPreviousColor = normalizeGoogleCalendarColor(previousValues.colorOverride);

    if (normalizedPreviousColor !== normalizedNextColor) {
        updateInput.colorOverride = normalizedNextColor;
    }

    return Object.keys(updateInput).length > 1 ? updateInput : null;
}

export function areCalendarFormValuesEqual(left: CalendarFormValues, right: CalendarFormValues) {
    return serializeCalendarFormValues(left) === serializeCalendarFormValues(right);
}

export function normalizeReminderLeadMinutesList(
    value: GoogleCalendarSummary['reminderLeadMinutesList'],
): GoogleCalendarSummary['reminderLeadMinutesList'] {
    const normalized = [...new Set(value)]
        .filter((entry): entry is GoogleCalendarSummary['reminderLeadMinutesList'][number] =>
            GOOGLE_REMINDER_LEAD_OPTIONS.includes(
                entry as (typeof GOOGLE_REMINDER_LEAD_OPTIONS)[number],
            ),
        )
        .sort((left, right) => left - right);

    return normalized.length > 0 ? normalized : [15];
}

function serializeCalendarFormValues(values: CalendarFormValues) {
    return JSON.stringify({
        ...values,
        reminderLeadMinutesList: normalizeReminderLeadMinutesList(values.reminderLeadMinutesList),
    });
}

function areReminderLeadMinutesListsEqual(
    left: GoogleCalendarSummary['reminderLeadMinutesList'],
    right: GoogleCalendarSummary['reminderLeadMinutesList'],
) {
    return (
        JSON.stringify(normalizeReminderLeadMinutesList(left)) ===
        JSON.stringify(normalizeReminderLeadMinutesList(right))
    );
}
