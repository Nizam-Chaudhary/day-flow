import { app } from 'electron';

const WAYLAND_SESSION_TYPE = 'wayland';
const WAYLAND_OZONE_PLATFORM = 'wayland';
const WAYLAND_COLOR_MANAGER_FEATURE = 'WaylandWpColorManagerV1';
const DAY_FLOW_OZONE_PLATFORM_ENV = 'DAY_FLOW_OZONE_PLATFORM';
const DAY_FLOW_WAYLAND_COLOR_MANAGER_ENV = 'DAY_FLOW_WAYLAND_COLOR_MANAGER';
const XDG_SESSION_TYPE_ENV = 'XDG_SESSION_TYPE';

export function configureLinuxGraphicsPlatform(): void {
    if (process.platform !== 'linux') {
        return;
    }

    if (app.commandLine.hasSwitch('ozone-platform')) {
        return;
    }

    const requestedPlatform = process.env[DAY_FLOW_OZONE_PLATFORM_ENV];

    if (requestedPlatform) {
        app.commandLine.appendSwitch('ozone-platform', requestedPlatform);
    }

    if (process.env[XDG_SESSION_TYPE_ENV] === WAYLAND_SESSION_TYPE) {
        if (!requestedPlatform) {
            app.commandLine.appendSwitch('ozone-platform', WAYLAND_OZONE_PLATFORM);
        }

        if (process.env[DAY_FLOW_WAYLAND_COLOR_MANAGER_ENV] !== '1') {
            // Chromium added Wayland color-management-v1 behind this feature
            // flag. Keep native Wayland enabled, but disable the unstable color
            // manager path by default until the startup errors are resolved on
            // common compositor stacks.
            app.commandLine.appendSwitch('disable-features', WAYLAND_COLOR_MANAGER_FEATURE);
        }
    }
}
