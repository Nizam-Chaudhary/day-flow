import { z } from 'zod';

export const DAY_FLOW_ERROR_CODES = [
    'AUTH_ERROR',
    'DATABASE_ERROR',
    'INTERNAL_ERROR',
    'INVALID_INPUT',
    'INTEGRATION_ERROR',
    'NOT_FOUND',
] as const;

export const dayFlowErrorCodeSchema = z.enum(DAY_FLOW_ERROR_CODES);
export const dayFlowErrorSchema = z.object({
    code: dayFlowErrorCodeSchema,
    message: z.string(),
    details: z.string().optional(),
});

export const dayFlowResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.union([
        z.object({
            ok: z.literal(true),
            data: dataSchema,
        }),
        z.object({
            ok: z.literal(false),
            error: dayFlowErrorSchema,
        }),
    ]);

export type DayFlowErrorCode = z.infer<typeof dayFlowErrorCodeSchema>;
export type DayFlowError = z.infer<typeof dayFlowErrorSchema>;
export type DayFlowResult<T> = { ok: true; data: T } | { ok: false; error: DayFlowError };
export type DayFlowRendererError = Error & DayFlowError;

export function createDayFlowError(
    code: DayFlowErrorCode,
    message: string,
    details?: string,
): DayFlowError {
    return dayFlowErrorSchema.parse({
        code,
        details,
        message,
    });
}

export function dayFlowOk<T>(data: T): DayFlowResult<T> {
    return { ok: true, data };
}

export function dayFlowErr(error: DayFlowError): DayFlowResult<never> {
    return { ok: false, error };
}

export function isDayFlowError(value: unknown): value is DayFlowError {
    return dayFlowErrorSchema.safeParse(value).success;
}

export function normalizeDayFlowError(
    error: unknown,
    fallbackCode: DayFlowErrorCode = 'INTERNAL_ERROR',
): DayFlowError {
    if (isDayFlowError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return createDayFlowError(fallbackCode, error.message);
    }

    return createDayFlowError(fallbackCode, 'An unexpected error occurred.');
}

export function toDayFlowRendererError(error: DayFlowError): DayFlowRendererError {
    const rendererError = new Error(error.message) as DayFlowRendererError;

    rendererError.name = 'DayFlowError';
    rendererError.code = error.code;
    rendererError.details = error.details;

    return rendererError;
}
