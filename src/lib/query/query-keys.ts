export const queryKeys = {
    app: {
        health: () => ['app', 'health'] as const,
    },
    settings: {
        preferences: () => ['settings', 'preferences'] as const,
    },
    googleCalendar: {
        connection: (connectionId: string) =>
            ['google-calendar', 'connection', connectionId] as const,
        connections: () => ['google-calendar', 'connections'] as const,
    },
};
