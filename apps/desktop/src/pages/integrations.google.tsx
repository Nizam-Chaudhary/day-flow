import { createFileRoute } from '@tanstack/react-router';

import { GoogleCalendarIntegrationPage } from '@/features/google-calendar/google-calendar-integration-page';

export const Route = createFileRoute('/integrations/google')({
    component: GoogleCalendarRoute,
});

function GoogleCalendarRoute() {
    return <GoogleCalendarIntegrationPage />;
}
