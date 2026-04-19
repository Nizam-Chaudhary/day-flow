import type {
    GoogleConnectionDetail,
    StartGoogleConnectionResult,
    UpdateGoogleCalendarInput,
    UpdateGoogleConnectionInput,
} from '@day-flow/contracts/google-calendar';

export function listGoogleCalendarConnections(): Promise<GoogleConnectionDetail[]> {
    return window.dayFlowApi.googleCalendar.listConnections();
}

export function getGoogleCalendarConnectionDetail(
    connectionId: string,
): Promise<GoogleConnectionDetail> {
    return window.dayFlowApi.googleCalendar.getConnectionDetail(connectionId);
}

export function startGoogleCalendarConnection(): Promise<StartGoogleConnectionResult> {
    return window.dayFlowApi.googleCalendar.startConnection();
}

export function updateGoogleCalendarConnection(
    input: UpdateGoogleConnectionInput,
): Promise<GoogleConnectionDetail> {
    return window.dayFlowApi.googleCalendar.updateConnection(input);
}

export function updateGoogleCalendar(
    input: UpdateGoogleCalendarInput,
): Promise<GoogleConnectionDetail> {
    return window.dayFlowApi.googleCalendar.updateCalendar(input);
}

export function syncGoogleCalendarConnection(
    connectionId: string,
): Promise<GoogleConnectionDetail> {
    return window.dayFlowApi.googleCalendar.syncConnection(connectionId);
}

export function disconnectGoogleCalendarConnection(connectionId: string): Promise<void> {
    return window.dayFlowApi.googleCalendar.disconnectConnection(connectionId);
}
