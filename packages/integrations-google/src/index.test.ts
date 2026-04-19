import { describe, expect, it, vi } from 'vitest';

import { GoogleCalendarSyncService, GoogleTokenStore } from './index';

describe('GoogleTokenStore', () => {
    it('falls back to sqlite plaintext when keychain is unavailable', async () => {
        const tokenStore = new GoogleTokenStore(null);

        await expect(
            tokenStore.store('google:user-1', {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email',
            }),
        ).resolves.toEqual({
            credentialStorageMode: 'sqlite_plaintext',
            secretRef: null,
            tokens: {
                accessToken: 'access-token',
                expiresAt: null,
                refreshToken: 'refresh-token',
                scope: 'openid email',
            },
        });
    });

    it('stores credentials in keychain when available', async () => {
        const setPassword = vi.fn<
            (service: string, account: string, password: string) => Promise<void>
        >(async () => {});
        const tokenStore = new GoogleTokenStore({
            deletePassword: vi.fn<(service: string, account: string) => Promise<boolean>>(),
            getPassword: vi.fn<(service: string, account: string) => Promise<string | null>>(),
            setPassword,
        });

        const result = await tokenStore.store('google:user-1', {
            accessToken: 'access-token',
            expiresAt: null,
            refreshToken: 'refresh-token',
            scope: 'openid email',
        });

        expect(setPassword).toHaveBeenCalledTimes(1);
        expect(result.credentialStorageMode).toBe('keychain');
        expect(result.tokens).toBeNull();
    });
});

describe('GoogleCalendarSyncService', () => {
    it('skips calendars that are not due yet', () => {
        const service = new GoogleCalendarSyncService({} as never, {} as never, {} as never);

        expect(
            service.shouldSyncCalendar({
                lastSyncAt: new Date().toISOString(),
                syncEnabled: true,
                syncIntervalMinutes: 60,
            }),
        ).toBe(false);
    });

    it('allows sync for unsynced calendars', () => {
        const service = new GoogleCalendarSyncService({} as never, {} as never, {} as never);

        expect(
            service.shouldSyncCalendar({
                lastSyncAt: null,
                syncEnabled: true,
                syncIntervalMinutes: 60,
            }),
        ).toBe(true);
    });
});
