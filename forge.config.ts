import type { ForgeConfig } from '@electron-forge/shared-types';

import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerFlatpak } from '@electron-forge/maker-flatpak';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { MakerAppImage } from '@reforged/maker-appimage';

import { MakerRpm } from './src/packaging/maker-rpm';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        executableName: 'day-flow',
        extraResource: ['drizzle', 'assets'],
        icon: 'assets/icons/day-flow_1024x1024.png',
    },
    makers: [
        new MakerSquirrel(
            {
                setupIcon: 'assets/icons/day-flow.ico',
            },
            ['win32'],
        ),
        new MakerZIP({}, ['darwin']),
        new MakerDeb(
            {
                options: {
                    icon: 'assets/icons/day-flow_1024x1024.png',
                },
            },
            ['linux'],
        ),
        new MakerRpm(
            {
                options: {
                    icon: 'assets/icons/day-flow_1024x1024.png',
                },
            },
            ['linux'],
        ),
        new MakerAppImage(
            {
                options: {
                    icon: 'assets/icons/day-flow_1024x1024.png',
                },
            },
            ['linux'],
        ),
        new MakerFlatpak(
            {
                options: {
                    files: [],
                    icon: 'assets/icons/day-flow_1024x1024.png',
                    id: 'com.dayflow.app',
                },
            },
            ['linux'],
        ),
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new VitePlugin({
            build: [
                {
                    entry: 'src/main.ts',
                    config: 'vite.main.config.ts',
                },
                {
                    entry: 'src/preload.ts',
                    config: 'vite.preload.config.ts',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.config.ts',
                },
            ],
        }),
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};

export default config;
