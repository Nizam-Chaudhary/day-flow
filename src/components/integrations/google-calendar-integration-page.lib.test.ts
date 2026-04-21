import { describe, expect, it } from 'vitest';

import type { CalendarFormValues } from '@/components/integrations/google-calendar-integration-page.lib';

import { buildGoogleCalendarUpdateInput } from '@/components/integrations/google-calendar-integration-page.lib';

const baseValues: CalendarFormValues = {
    calendarColorType: 'custom',
    colorOverride: '#22c55e',
    isSelected: true,
    reminderEnabled: false,
    reminderLeadMinutesList: [15],
    syncEnabled: true,
    syncIntervalMinutes: 15,
};

describe('buildGoogleCalendarUpdateInput', () => {
    it('returns null when nothing effectively changes', () => {
        expect(buildGoogleCalendarUpdateInput(baseValues, baseValues, 'calendar-1')).toBeNull();
    });

    it('returns only the changed fields', () => {
        expect(
            buildGoogleCalendarUpdateInput(
                baseValues,
                {
                    ...baseValues,
                    isSelected: false,
                    syncIntervalMinutes: 30,
                },
                'calendar-1',
            ),
        ).toEqual({
            calendarId: 'calendar-1',
            isSelected: false,
            syncIntervalMinutes: 30,
        });
    });

    it('forces the in-app reminder channel for reminder changes', () => {
        expect(
            buildGoogleCalendarUpdateInput(
                baseValues,
                {
                    ...baseValues,
                    reminderEnabled: true,
                    reminderLeadMinutesList: [60, 15, 15],
                },
                'calendar-1',
            ),
        ).toEqual({
            calendarId: 'calendar-1',
            reminderChannel: 'in_app',
            reminderEnabled: true,
            reminderLeadMinutesList: [15, 60],
        });
    });

    it('normalizes colors before diffing', () => {
        expect(
            buildGoogleCalendarUpdateInput(
                baseValues,
                {
                    ...baseValues,
                    colorOverride: '#22C55E',
                },
                'calendar-1',
            ),
        ).toBeNull();
    });
});
