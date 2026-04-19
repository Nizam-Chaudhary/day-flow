import type { IconSvgElement } from '@hugeicons/react';

import {
    Calendar01Icon,
    CheckListIcon,
    ClockAlertIcon,
    Globe02Icon,
    GoogleIcon,
    Home01Icon,
    LinkSquare02Icon,
    Note01Icon,
    Notification03Icon,
    PlusSignIcon,
    Search01Icon,
    Settings01Icon,
    SlackIcon,
} from '@hugeicons/core-free-icons';
import { addDays, format, startOfWeek, subMinutes } from 'date-fns';

const todayDate = new Date();
const anchorDate = todayDate;
const todayIso = format(todayDate, 'yyyy-MM-dd');
const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });

export type ShellNavTo =
    | '/'
    | '/calendar'
    | '/tasks'
    | '/reminders'
    | '/notes'
    | '/integrations'
    | '/settings';

export interface ShellNavSubItem {
    label: string;
    to: ShellNavTo;
}

export interface ShellNavItem {
    description: string;
    icon: IconSvgElement;
    items?: ShellNavSubItem[];
    label: string;
    to: ShellNavTo;
}

export interface MockEvent {
    calendar: string;
    date: string;
    description: string;
    endTime: string;
    id: string;
    linkedNote: string;
    linkedTask: string;
    location: string;
    reminder: string;
    source: string;
    startTime: string;
    title: string;
}

export interface MockTask {
    bucket: 'completed' | 'today' | 'upcoming';
    dueLabel: string;
    id: string;
    linkedEvent: string;
    notionPage: string;
    priority: 'High' | 'Low' | 'Medium';
    reminder: string;
    status: 'Done' | 'In progress' | 'Todo';
    title: string;
}

export interface MockReminder {
    actionLabel: string;
    id: string;
    source: 'Event' | 'Manual' | 'Task';
    state: 'completed' | 'snoozed' | 'upcoming';
    timeLabel: string;
    title: string;
}

export interface MockNotification {
    body: string;
    id: string;
    title: string;
    unread: boolean;
}

export interface MockNoteDatabase {
    description: string;
    name: string;
    pages: number;
}

export interface MockPageLink {
    id: string;
    lastEdited: string;
    summary: string;
    title: string;
}

export interface MockIntegrationProvider {
    description: string;
    id: 'apple' | 'google' | 'notion' | 'outlook' | 'slack';
    lastSyncText: string;
    name: string;
    status: 'Connected' | 'Needs attention' | 'Not connected';
}

export interface MockFieldMapping {
    appField: string;
    notionField: string;
}

export const shellBrand = {
    name: 'Day Flow',
};

export const mainNavItems = [
    {
        description: 'Daily command center',
        icon: Home01Icon,
        label: 'Today',
        to: '/',
    },
    {
        description: 'Unified scheduling',
        icon: Calendar01Icon,
        label: 'Calendar',
        to: '/calendar',
    },
    {
        description: 'Task execution lane',
        icon: CheckListIcon,
        label: 'Tasks',
        to: '/tasks',
    },
    {
        description: 'Time-based follow-ups',
        icon: ClockAlertIcon,
        label: 'Reminders',
        to: '/reminders',
    },
    {
        description: 'Notion quick access',
        icon: Note01Icon,
        label: 'Notes',
        to: '/notes',
    },
    {
        description: 'Providers and mappings',
        icon: LinkSquare02Icon,
        label: 'Integrations',
        to: '/integrations',
    },
] satisfies ShellNavItem[];

export const footerNavItems = [
    {
        description: 'Preferences and diagnostics',
        icon: Settings01Icon,
        label: 'Settings',
        to: '/settings',
    },
] satisfies ShellNavItem[];

export const searchNavItems = [...mainNavItems, ...footerNavItems] satisfies ShellNavItem[];

export const shellNotifications = [
    {
        body: 'Standup notes are still unlinked to today’s design review.',
        id: 'notif-link-notes',
        title: 'Notion follow-up pending',
        unread: true,
    },
    {
        body: 'Google Calendar finished its last background pull 12 minutes ago.',
        id: 'notif-sync',
        title: 'Sync completed cleanly',
        unread: true,
    },
    {
        body: 'Slack reminder delivery is still disabled until a workspace is connected.',
        id: 'notif-slack',
        title: 'Slack integration idle',
        unread: false,
    },
] satisfies MockNotification[];

export const quickActionSearchItems = [
    {
        icon: PlusSignIcon,
        id: 'add-task',
        label: 'Add Task',
        shortcut: 'Task',
    },
    {
        icon: Calendar01Icon,
        id: 'add-event',
        label: 'Add Event',
        shortcut: 'Event',
    },
    {
        icon: Note01Icon,
        id: 'quick-note',
        label: 'Quick Note',
        shortcut: 'Notes',
    },
    {
        icon: Notification03Icon,
        id: 'sync-now',
        label: 'Sync Now',
        shortcut: 'Refresh',
    },
] as const;

export const searchMetadata = {
    icon: Search01Icon,
    title: 'Global search',
};

export const todaySummary = {
    eyebrow: format(todayDate, 'EEEE, MMMM d'),
    headline: 'Keep the day narrow, visible, and easy to reschedule.',
    summary: 'Three meetings, four active tasks, and two reminders need attention before 6 PM.',
};

export const mockEvents = [
    {
        calendar: 'Leadership',
        date: todayIso,
        description: 'Review launch blockers, owners, and cross-team risks before noon.',
        endTime: '09:45',
        id: 'evt-standup',
        linkedNote: 'Launch cadence',
        linkedTask: 'Prepare blocker digest',
        location: 'Studio room',
        reminder: '10 minutes before',
        source: 'Google Calendar',
        startTime: '09:00',
        title: 'Launch standup',
    },
    {
        calendar: 'Product',
        date: todayIso,
        description: 'Finalize the dashboard shell scope and sequence follow-up fixes.',
        endTime: '13:30',
        id: 'evt-review',
        linkedNote: 'Today dashboard review',
        linkedTask: 'Adjust shell spacing',
        location: 'Main workspace',
        reminder: '15 minutes before',
        source: 'Notion',
        startTime: '12:45',
        title: 'Design review',
    },
    {
        calendar: 'Personal',
        date: todayIso,
        description: 'Confirm tomorrow’s planning window and capture any carry-over tasks.',
        endTime: '17:15',
        id: 'evt-wrap',
        linkedNote: 'Daily wrap',
        linkedTask: 'Close open reminders',
        location: 'Focus desk',
        reminder: 'At start time',
        source: 'Apple Calendar',
        startTime: '16:45',
        title: 'Daily wrap-up',
    },
    {
        calendar: 'Client',
        date: format(addDays(weekStart, 1), 'yyyy-MM-dd'),
        description: 'Clarify scope changes and confirm the handoff sequence for next week.',
        endTime: '11:00',
        id: 'evt-client',
        linkedNote: 'Client planning notes',
        linkedTask: 'Send revised recap',
        location: 'Meet link',
        reminder: '30 minutes before',
        source: 'Outlook',
        startTime: '10:00',
        title: 'Client planning call',
    },
    {
        calendar: 'Ops',
        date: format(addDays(weekStart, 3), 'yyyy-MM-dd'),
        description: 'Check sync reliability and remaining manual fallbacks.',
        endTime: '15:00',
        id: 'evt-ops',
        linkedNote: 'Ops review',
        linkedTask: 'Validate sync states',
        location: 'Ops board',
        reminder: '15 minutes before',
        source: 'Google Calendar',
        startTime: '14:00',
        title: 'Integration review',
    },
] satisfies MockEvent[];

export const calendarColumns = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);

    return {
        date: format(date, 'yyyy-MM-dd'),
        dayLabel: format(date, 'EEE'),
        id: format(date, 'yyyy-MM-dd'),
        numericDate: format(date, 'd'),
    };
});

export const todayEvents = mockEvents.filter((event) => event.date === todayIso);

export const mockTasks = [
    {
        bucket: 'today',
        dueLabel: 'Today, 11:30 AM',
        id: 'task-blockers',
        linkedEvent: 'Launch standup',
        notionPage: 'Launch checklist',
        priority: 'High',
        reminder: '11:00 AM',
        status: 'In progress',
        title: 'Prepare blocker digest',
    },
    {
        bucket: 'today',
        dueLabel: 'Today, 2:00 PM',
        id: 'task-shell',
        linkedEvent: 'Design review',
        notionPage: 'Shell polish backlog',
        priority: 'Medium',
        reminder: '1:30 PM',
        status: 'Todo',
        title: 'Adjust shell spacing',
    },
    {
        bucket: 'today',
        dueLabel: 'Today, 5:45 PM',
        id: 'task-reminders',
        linkedEvent: 'Daily wrap-up',
        notionPage: 'Reminder audit',
        priority: 'High',
        reminder: '5:15 PM',
        status: 'Todo',
        title: 'Close open reminders',
    },
    {
        bucket: 'upcoming',
        dueLabel: 'Tomorrow, 10:00 AM',
        id: 'task-recap',
        linkedEvent: 'Client planning call',
        notionPage: 'Client handoff',
        priority: 'Medium',
        reminder: 'Tomorrow, 9:20 AM',
        status: 'Todo',
        title: 'Send revised recap',
    },
    {
        bucket: 'completed',
        dueLabel: 'Completed at 8:20 AM',
        id: 'task-inbox',
        linkedEvent: 'None',
        notionPage: 'Morning triage',
        priority: 'Low',
        reminder: 'N/A',
        status: 'Done',
        title: 'Clear inbox capture',
    },
] satisfies MockTask[];

export const todayTasks = mockTasks.filter((task) => task.bucket === 'today');

export const mockReminders = [
    {
        actionLabel: 'Open standup notes',
        id: 'reminder-standup',
        source: 'Task',
        state: 'upcoming',
        timeLabel: '11:00 AM',
        title: 'Prepare blocker digest',
    },
    {
        actionLabel: 'Jump into review',
        id: 'reminder-review',
        source: 'Event',
        state: 'upcoming',
        timeLabel: '12:30 PM',
        title: 'Design review starts soon',
    },
    {
        actionLabel: 'Re-open nightly wrap',
        id: 'reminder-wrap',
        source: 'Manual',
        state: 'snoozed',
        timeLabel: 'Snoozed to 6:10 PM',
        title: 'Capture loose ends before sign-off',
    },
    {
        actionLabel: 'View completed recap',
        id: 'reminder-complete',
        source: 'Task',
        state: 'completed',
        timeLabel: 'Dismissed at 8:45 AM',
        title: 'Check overnight sync errors',
    },
] satisfies MockReminder[];

export const todayReminders = mockReminders.filter((reminder) => reminder.state === 'upcoming');

export const noteDatabases = [
    {
        description: 'Operational tasks mirrored from active projects.',
        name: 'Execution DB',
        pages: 126,
    },
    {
        description: 'Loose notes, standups, and meeting recaps.',
        name: 'Daily Notes',
        pages: 84,
    },
    {
        description: 'Reference docs used for calendar and workflow setup.',
        name: 'Systems Library',
        pages: 42,
    },
] satisfies MockNoteDatabase[];

export const recentPages = [
    {
        id: 'page-launch',
        lastEdited: 'Edited 18 minutes ago',
        summary: 'Launch scope, owners, and unresolved blockers.',
        title: 'Launch cadence',
    },
    {
        id: 'page-dashboard',
        lastEdited: 'Edited 1 hour ago',
        summary: 'Today dashboard notes and quick follow-up actions.',
        title: 'Today dashboard review',
    },
    {
        id: 'page-ops',
        lastEdited: 'Edited yesterday',
        summary: 'Sync reliability notes and provider edge cases.',
        title: 'Ops review',
    },
] satisfies MockPageLink[];

export const integrationProviders = [
    {
        description: 'Primary work calendar and background event sync.',
        id: 'google',
        lastSyncText: 'Synced 12 minutes ago',
        name: 'Google Calendar',
        status: 'Connected',
    },
    {
        description: 'Local Apple calendar sources for personal planning.',
        id: 'apple',
        lastSyncText: 'Waiting for first connect',
        name: 'Apple Calendar',
        status: 'Not connected',
    },
    {
        description: 'Cross-account meetings and external client events.',
        id: 'outlook',
        lastSyncText: 'Needs permission refresh',
        name: 'Outlook',
        status: 'Needs attention',
    },
    {
        description: 'Databases and linked pages for tasks, notes, and references.',
        id: 'notion',
        lastSyncText: 'Synced 27 minutes ago',
        name: 'Notion',
        status: 'Connected',
    },
    {
        description: 'Delivery channel for reminder nudges and summaries.',
        id: 'slack',
        lastSyncText: 'Not connected',
        name: 'Slack',
        status: 'Not connected',
    },
] satisfies MockIntegrationProvider[];

export const integrationIcons: Record<MockIntegrationProvider['id'], IconSvgElement> = {
    apple: Calendar01Icon,
    google: GoogleIcon,
    notion: Note01Icon,
    outlook: Globe02Icon,
    slack: SlackIcon,
};

export const notionFieldMappings = [
    { appField: 'Title', notionField: 'Name' },
    { appField: 'Due Date', notionField: 'Deadline' },
    { appField: 'Status', notionField: 'Stage' },
    { appField: 'Reminder', notionField: 'Reminder Time' },
    { appField: 'Linked Event', notionField: 'Calendar Reference' },
] satisfies MockFieldMapping[];

export const shellLastSyncText = format(subMinutes(anchorDate, 12), 'p');
