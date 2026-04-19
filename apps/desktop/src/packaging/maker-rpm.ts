import type { MakerRpmConfig } from '@electron-forge/maker-rpm';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ElectronInstallerResult = {
    packagePaths: string[];
};

type ElectronInstallerModule = ((
    options: Record<string, unknown>,
) => Promise<ElectronInstallerResult>) & {
    Installer: new (options: Record<string, unknown>) => {
        specPath: string;
        options: Record<string, unknown>;
        generateDefaults(): Promise<void>;
        generateOptions(): void;
        generateScripts(): Promise<void>;
        createStagingDir(): Promise<void>;
        createContents(): Promise<void>;
        createPackage(): Promise<void>;
        movePackage(): Promise<void>;
        createTemplatedFile(
            templatePath: string,
            dest: string,
            filePermissions?: string,
        ): Promise<void>;
    };
};

function renameRpm(dest: string, _src: string): string {
    return path.join(
        dest,
        '<%= name %>-<%= version %>-<%= revision %>.<%= arch === "aarch64" ? "arm64" : arch %>.rpm',
    );
}

function sanitizeLinuxPackageName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9+._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function resolveBundledBinaryName({
    dir,
    appName,
    explicitBin,
}: {
    dir: string;
    appName: string;
    explicitBin?: string;
}): Promise<string> {
    const candidateNames = new Set(
        [explicitBin, appName]
            .filter(
                (value): value is string => typeof value === 'string' && value.trim().length > 0,
            )
            .map((value) => value.trim()),
    );

    for (const candidateName of candidateNames) {
        try {
            const stats = await fs.stat(path.join(dir, candidateName));
            if (stats.isFile()) {
                return candidateName;
            }
        } catch {}
    }

    const directoryEntries = await fs.readdir(dir, { withFileTypes: true });
    const executableEntry = directoryEntries.find(
        (entry) =>
            entry.isFile() &&
            !entry.name.startsWith('.') &&
            entry.name !== 'LICENSE' &&
            entry.name !== 'LICENSES.chromium.html' &&
            !entry.name.endsWith('.pak') &&
            !entry.name.endsWith('.bin') &&
            !entry.name.endsWith('.dat') &&
            !entry.name.endsWith('.json') &&
            entry.name !== 'version',
    );

    if (!executableEntry) {
        throw new Error(`Unable to determine the packaged Electron binary in "${dir}"`);
    }

    return executableEntry.name;
}

export function rpmArch(nodeArch: ForgeArch): string {
    switch (nodeArch) {
        case 'ia32':
            return 'i386';
        case 'x64':
            return 'x86_64';
        case 'arm64':
            return 'aarch64';
        case 'armv7l':
            return 'armv7hl';
        case 'arm':
            return 'armv6hl';
        default:
            return nodeArch;
    }
}

export class MakerRpm extends MakerBase<MakerRpmConfig> {
    name = '@electron-forge/maker-rpm';

    defaultPlatforms: ForgePlatform[] = ['linux'];

    requiredExternalBinaries: string[] = ['rpmbuild'];

    isSupportedOnCurrentPlatform(): boolean {
        return this.isInstalled('electron-installer-redhat');
    }

    async make({
        dir,
        makeDir,
        targetArch,
        appName,
        forgeConfig,
        packageJSON,
    }: MakerOptions): Promise<string[]> {
        const installerModule = require('electron-installer-redhat') as ElectronInstallerModule;
        const outDir = path.resolve(makeDir, 'rpm', targetArch);
        const specTemplatePath = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            'rpm.spec.ejs',
        );
        const configuredExecutableName = forgeConfig.packagerConfig.executableName;
        const packageName = sanitizeLinuxPackageName(
            configuredExecutableName ??
                packageJSON.executableName ??
                packageJSON.productName ??
                appName,
        );
        const productName = packageJSON.productName ?? appName;
        const bin = await resolveBundledBinaryName({
            dir,
            appName: productName,
            explicitBin: configuredExecutableName ?? packageJSON.executableName,
        });

        await this.ensureDirectory(outDir);

        const installer = new installerModule.Installer({
            ...this.config,
            bin,
            arch: rpmArch(targetArch),
            dest: outDir,
            logger: () => {},
            name: packageName,
            productName,
            rename: renameRpm,
            src: dir,
        });

        await installer.generateDefaults();
        installer.generateOptions();
        await installer.generateScripts();
        await installer.createStagingDir();
        await installer.createContents();
        await installer.createTemplatedFile(specTemplatePath, installer.specPath);
        await installer.createPackage();
        await installer.movePackage();

        const packagePaths = installer.options.packagePaths;
        if (
            !Array.isArray(packagePaths) ||
            !packagePaths.every((packagePath) => typeof packagePath === 'string')
        ) {
            throw new TypeError('RPM packaging did not return any package paths');
        }

        return packagePaths;
    }
}

export default MakerRpm;
