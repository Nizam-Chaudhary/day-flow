export const DAY_FLOW_ERROR_CODES = ["DATABASE_ERROR", "INTERNAL_ERROR", "INVALID_INPUT"] as const;

export type DayFlowErrorCode = (typeof DAY_FLOW_ERROR_CODES)[number];

export interface DayFlowError {
    code: DayFlowErrorCode;
    message: string;
    details?: string;
}

export type DayFlowResult<T> = { ok: true; data: T } | { ok: false; error: DayFlowError };

export type DayFlowRendererError = Error & DayFlowError;

export function createDayFlowError(
    code: DayFlowErrorCode,
    message: string,
    details?: string,
): DayFlowError {
    return {
        code,
        message,
        ...(details ? { details } : {}),
    };
}

export function dayFlowOk<T>(data: T): DayFlowResult<T> {
    return { ok: true, data };
}

export function dayFlowErr(error: DayFlowError): DayFlowResult<never> {
    return { ok: false, error };
}

export function isDayFlowError(value: unknown): value is DayFlowError {
    if (!value || typeof value !== "object") {
        return false;
    }

    const { code, message } = value as Partial<DayFlowError>;

    return (
        typeof message === "string" &&
        typeof code === "string" &&
        DAY_FLOW_ERROR_CODES.includes(code as DayFlowErrorCode)
    );
}

export function normalizeDayFlowError(
    error: unknown,
    fallbackCode: DayFlowErrorCode = "INTERNAL_ERROR",
): DayFlowError {
    if (isDayFlowError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return createDayFlowError(fallbackCode, error.message);
    }

    return createDayFlowError(fallbackCode, "An unexpected error occurred.");
}

export function toDayFlowRendererError(error: DayFlowError): DayFlowRendererError {
    const rendererError = new Error(error.message) as DayFlowRendererError;

    rendererError.name = "DayFlowError";
    rendererError.code = error.code;
    rendererError.details = error.details;

    return rendererError;
}
