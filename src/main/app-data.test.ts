import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPath, setPath } = vi.hoisted(() => ({
    getPath: vi.fn<(name: string) => string>(),
    setPath: vi.fn<(name: string, value: string) => void>(),
}));

vi.mock('electron', () => ({
    app: {
        getPath,
        setPath,
    },
}));

import { configureUserDataPath } from '@/main/app-data';

describe('configureUserDataPath', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getPath.mockReturnValue('/tmp/Day Flow');
    });

    it('pins userData to the day-flow directory', () => {
        configureUserDataPath();

        expect(getPath).toHaveBeenCalledWith('userData');
        expect(setPath).toHaveBeenCalledWith('userData', '/tmp/day-flow');
    });
});
