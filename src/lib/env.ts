import { createEnv } from '@t3-oss/env-core';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const BOOLEAN_ENV_TRUE_VALUES = new Set(['1', 'true', 'TRUE']);
const BOOLEAN_ENV_VALUES = ['0', '1', 'false', 'FALSE', 'true', 'TRUE'] as const;

function resolveEnvFilePath(): string {
    const candidatePaths = [resolve(process.cwd(), '.env.local'), resolve(process.cwd(), '.env')];

    return candidatePaths.find((candidatePath) => existsSync(candidatePath)) ?? candidatePaths[1];
}

dotenv.config({
    path: resolveEnvFilePath(),
    quiet: true,
});

export const booleanEnvSchema = z.enum(BOOLEAN_ENV_VALUES).transform((value) => {
    return BOOLEAN_ENV_TRUE_VALUES.has(value);
});

export function createBooleanEnvSchema(defaultValue: boolean) {
    return booleanEnvSchema.optional().transform((value) => value ?? defaultValue);
}

export const env = createEnv({
    server: {
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
        DAY_FLOW_AUTH_HOST: z.string().default('127.0.0.1'),
        DAY_FLOW_AUTH_PORT: z.coerce.number().int().min(0).default(0),
        DAY_FLOW_OPEN_DEVTOOLS: createBooleanEnvSchema(false),
        DAY_FLOW_OZONE_PLATFORM: z.string().optional(),
        DAY_FLOW_WAYLAND_COLOR_MANAGER: createBooleanEnvSchema(false),
        XDG_SESSION_TYPE: z.string().optional(),
    },
    runtimeEnvStrict: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        DAY_FLOW_AUTH_HOST: process.env.DAY_FLOW_AUTH_HOST,
        DAY_FLOW_AUTH_PORT: process.env.DAY_FLOW_AUTH_PORT,
        DAY_FLOW_OPEN_DEVTOOLS: process.env.DAY_FLOW_OPEN_DEVTOOLS,
        DAY_FLOW_OZONE_PLATFORM: process.env.DAY_FLOW_OZONE_PLATFORM,
        DAY_FLOW_WAYLAND_COLOR_MANAGER: process.env.DAY_FLOW_WAYLAND_COLOR_MANAGER,
        XDG_SESSION_TYPE: process.env.XDG_SESSION_TYPE,
    },
    emptyStringAsUndefined: true,
});
