export interface GoogleCalendarColorOption {
    id: string;
    label: string;
    value: string;
}

export const GOOGLE_CALENDAR_CURATED_COLORS = [
    { id: 'blue', label: 'Blue', value: '#1a73e8' },
    { id: 'sage', label: 'Sage', value: '#7cb342' },
    { id: 'grape', label: 'Grape', value: '#8e24aa' },
    { id: 'flamingo', label: 'Flamingo', value: '#d81b60' },
    { id: 'tangerine', label: 'Tangerine', value: '#f4511e' },
    { id: 'banana', label: 'Banana', value: '#f6bf26' },
    { id: 'peacock', label: 'Peacock', value: '#039be5' },
    { id: 'graphite', label: 'Graphite', value: '#616161' },
] as const satisfies GoogleCalendarColorOption[];

const DEFAULT_GOOGLE_CALENDAR_COLOR = GOOGLE_CALENDAR_CURATED_COLORS[0].value;

export function normalizeGoogleCalendarColor(value: string | null | undefined): string {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
        return DEFAULT_GOOGLE_CALENDAR_COLOR;
    }

    const normalizedValue = trimmedValue.startsWith('#') ? trimmedValue : `#${trimmedValue}`;

    return /^#[0-9a-fA-F]{6}$/.test(normalizedValue)
        ? normalizedValue.toLowerCase()
        : DEFAULT_GOOGLE_CALENDAR_COLOR;
}

export function findGoogleCalendarCuratedColor(color: string | null | undefined) {
    const normalizedColor = normalizeGoogleCalendarColor(color);

    return (
        GOOGLE_CALENDAR_CURATED_COLORS.find((option) => option.value === normalizedColor) ?? null
    );
}

export function getGoogleCalendarColorOptions(activeColor?: string | null) {
    const curatedColor = findGoogleCalendarCuratedColor(activeColor);

    if (curatedColor || !activeColor) {
        return GOOGLE_CALENDAR_CURATED_COLORS;
    }

    return [
        {
            id: 'current',
            label: 'Current',
            value: normalizeGoogleCalendarColor(activeColor),
        },
        ...GOOGLE_CALENDAR_CURATED_COLORS,
    ] satisfies GoogleCalendarColorOption[];
}
