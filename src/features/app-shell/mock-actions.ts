const MOCK_ACTION_MIN_DELAY_MS = 600;
const MOCK_ACTION_MAX_DELAY_MS = 900;

function getMockDelay(): number {
    return (
        Math.floor(Math.random() * (MOCK_ACTION_MAX_DELAY_MS - MOCK_ACTION_MIN_DELAY_MS + 1)) +
        MOCK_ACTION_MIN_DELAY_MS
    );
}

function wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, delayMs);
    });
}

export async function runMockAction(successMessage: string): Promise<string> {
    await wait(getMockDelay());
    return successMessage;
}
