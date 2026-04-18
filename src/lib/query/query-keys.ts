export const queryKeys = {
    app: {
        health: () => ['app', 'health'] as const,
    },
    settings: {
        preferences: () => ['settings', 'preferences'] as const,
    },
};
