# Product Requirements Document (PRD)

## Product Name

Unified Calendar & Task Manager

## Version

High-Level PRD v1

## Owner

Nizam Chaudhary

## 1. Overview

This product is a local-first productivity application built primarily as an Electron desktop app, designed to unify calendars, tasks, events, todos, reminders, and notes-related workflows into a single system. The app will act as a central place where users can manage their schedule and task planning while integrating with external providers such as Google Calendar, Apple Calendar, Outlook, Notion, and Slack.

The app will focus on giving users a fast, reliable, and modular workspace for planning and reminder management. Notion will be treated as an important external system for tasks, notes, docs, and databases, while the app itself will serve as the primary operational interface for day-to-day calendar and task management.

The long-term vision is to build a polished integration platform that can optionally support cloud sync across devices, extensible integrations, and future commercialization.

## 2. Vision

Create a single application where users can:

- View and manage all events and tasks in one place.
- Sync with major calendar providers.
- Sync selected Notion databases for tasks, events, todos, reminders, and notes references.
- Receive reminders primarily through in-app notifications, with optional Slack notification support.
- Quickly jump from calendar/task context into linked Notion notes or task pages.
- Stay productive with a local-first experience that works well even without mandatory authentication.
- Optionally enable cloud sync for integrations and connected calendars across devices.

## 3. Problem Statement

Users often manage work and life across multiple tools:

- Calendar providers for meetings and events.
- Notion for tasks, notes, docs, and project organization.
- Slack for communication and reminders.
- Separate reminder systems that are not unified.

This leads to fragmented workflows, poor visibility, duplicated effort, and missed reminders. Users need a single operational app that brings all of these systems together while preserving flexibility and control.

## 4. Goals

### Primary Goals

- Provide a unified calendar and task management experience.
- Support major calendar providers including Google, Apple, Outlook, and similar providers where feasible.
- Allow configurable Notion database syncing for tasks, events, todos, and reminders.
- Deliver reliable in-app reminder notifications as the primary reminder channel.
- Enable fast access to linked notes, task pages, and databases in Notion.
- Keep the product local-first, fast, and usable without mandatory auth for core calendar usage.

### Secondary Goals

- Add Slack integration for reminders and notifications.
- Build a modular integration and notification system.
- Prepare the codebase so the same core logic can support Electron today and web in the future.
- Support export/import of integrations and settings for easy migration across devices.
- Enable optional authenticated sync in the future for multi-device continuity.

## 5. Non-Goals (Initial Phase)

- Full team collaboration platform.
- Full replacement for Notion docs or note editing.
- Full replacement for provider-native calendar features.
- Mandatory cloud account system from day one.
- Complex enterprise admin controls in v1.
- Multi-repo or monorepo setup in the first phase.

## 6. Target Users

### Primary Users

- Individual users who manage tasks and events across Notion and calendar providers.
- Professionals who use Notion for notes/docs and need stronger reminder and scheduling workflows.
- Users who want one dashboard for personal productivity.

### Secondary Users

- Power users who use multiple calendars and want configurable sync behavior.
- Early adopters interested in an extensible integration platform.
- Future paying users who want cross-device sync and premium integrations.

## 7. Core Product Principles

### Local-First

The application should work primarily from local storage using SQLite. Core usage should not require authentication.

### Integration-Driven

External systems such as Notion, calendar providers, and Slack should be connected through modular adapters.

### User-Controlled Sync

Users should control what gets synced, how fields map, and which sources are authoritative.

### Fast Daily Workflow

The application should prioritize speed for viewing calendar data, task lists, reminders, and quick jumps into Notion pages.

### Extensible Architecture

The app should be built so new integrations, notification channels, and future clients can reuse the same core modules.

## 8. High-Level Scope

### 8.1 Calendar Management

- Unified calendar view inside the app.
- Create, edit, and manage events locally.
- Connect and sync with major calendar providers:
    - Google Calendar
    - Apple Calendar / iCloud calendar where feasible
    - Outlook / Microsoft calendar
    - Other major providers through standards-based support if practical
- Merge provider events into a single view.
- Support local calendars as a first-class concept.

### 8.2 Task and Reminder Management

- Manage tasks, todos, reminders, and task-linked notes.
- Assign due dates, reminder times, priority, and status.
- Support task and event linking.
- Enable rich reminder handling primarily via in-app notifications.

### 8.3 Notion Integration

- Sync tasks, events, todos, and reminders with selected Notion databases.
- Let users dynamically configure field mappings.
- Allow users to choose which database fields correspond to title, due date, status, reminder, notes link, etc.
- Support quick actions to open task pages or notes databases in Notion.
- Enable quick note-taking workflows by linking a task/event to a Notion page.

### 8.4 Slack Integration

- Optional Slack-based reminder or notification delivery.
- Slack integration should complement, not replace, in-app notifications.

### 8.5 Notifications

- In-app notifications are the primary notification channel.
- Notification architecture should be modular enough to support:
    - Desktop notifications in Electron
    - Future browser/web notifications
    - OS-specific behavior
    - Packaging differences
    - Slack reminders
- Snooze and dismiss workflows should be considered in future iterations.

### 8.6 Sync and Portability

- Local-first by default.
- Optional authenticated sync in future for:
    - Connected integrations
    - Calendar connections
    - Settings
    - User preferences
- Export/import mechanism for transferring integrations and app setup to another device.

## 9. Functional Requirements

### FR1. Unified Calendar

- The system shall provide a calendar UI for day, week, month, and agenda-style viewing where appropriate.
- The system shall allow users to create and manage local events.
- The system shall display events from connected providers in one unified experience.

### FR2. Provider Integrations

- The system shall support connecting multiple calendar providers.
- The system shall normalize provider data into a shared internal model.
- The system shall preserve provider-specific metadata where needed.

### FR3. Local Data Management

- The system shall store core calendar, task, reminder, and integration metadata in SQLite.
- The system shall maintain local copies or cached snapshots of synced data.

### FR4. Notion Database Sync

- The system shall allow users to connect Notion and select one or more databases to sync.
- The system shall let users configure field mapping dynamically.
- The system shall support syncing tasks, events, todos, and reminders from Notion.
- The system shall support pushing updates back to Notion where enabled.

### FR5. Quick Open to Notion

- The system shall support opening linked Notion task or note pages from within the app.
- The system shall support jumping to a configured task or notes database quickly.

### FR6. Reminder System

- The system shall support reminders for tasks and events.
- The system shall trigger reminders primarily through in-app notifications.
- The system shall allow future extension to Slack and other channels.

### FR7. Modular Integrations

- The system shall implement integrations through modular adapters/services.
- The system shall isolate provider-specific logic from UI and domain layers.

### FR8. Export/Import

- The system shall support export of configuration and integration-related metadata for migration.
- The system shall support import on another device.

### FR9. Optional Auth and Cloud Sync

- The system shall not require authentication for core local-first usage.
- The system shall support future optional authentication for cross-device sync.

## 10. Non-Functional Requirements

### Performance

- Calendar and task views should load quickly from local storage.
- The app should remain usable even when external providers are temporarily unavailable.

### Reliability

- Reminder delivery should be dependable while the app is running.
- Sync failures should not corrupt local data.

### Maintainability

- Business logic should be separated from UI.
- Integration logic should be modular and reusable.
- The architecture should support future extraction into monorepo packages if needed.

### Extensibility

- Notification channels should be pluggable.
- New providers should be addable with minimal impact on the rest of the system.
- Shared domain logic should be reusable for Electron and future web app support.

### Security

- Provider credentials and tokens should be stored securely.
- Local sensitive configuration should be protected appropriately.

### Portability

- Export/import should allow movement of configuration between devices.
- Future sync should allow restoring the user’s setup with minimal friction.

## 11. User Experience Highlights

### Primary Workflows

- View all calendars and tasks together.
- Create or edit a local event.
- Connect a provider and sync events.
- Connect Notion and map database fields.
- Open a task in Notion to take notes or update properties.
- Receive and act on reminders.
- Export configuration and import it on another device.

### UX Priorities

- Fast access to today’s events and pending tasks.
- Easy provider connection flows.
- Clear sync status and conflict handling.
- Minimal friction in opening linked Notion items.
- Clean modular settings UI for integrations and notifications.

## 12. Data Model Direction (High Level)

Core entities likely include:

- Calendar
- Event
- Task
- Reminder
- Note Link / External Resource Link
- Integration
- Integration Account
- Sync Configuration
- Field Mapping
- Notification Rule
- Notification Delivery Record
- Export Package Metadata

The internal domain model should remain provider-agnostic, while adapters transform external provider data into internal formats.

## 13. Sync Strategy (High Level)

### Local-First Strategy

- The local database is the primary runtime store.
- Synced data is normalized into local records.
- UI reads from local storage first.

### Provider Sync Strategy

- Calendar providers sync through adapter modules.
- Notion sync uses configurable field mapping.
- Sync should support pull-first initially, with selective push where appropriate.

### Conflict Handling Direction

- Keep sync rules explicit.
- Allow source-of-truth selection per integration or entity type in future.
- Log sync state and failures for troubleshooting.

## 14. Modular Architecture Direction

The application should be structured around modules such as:

- Core domain layer
- Local database layer
- Integration layer
- Sync engine
- Notification engine
- UI layer
- Settings/configuration layer
- Import/export module
- Optional cloud sync module

This should allow a future shared-core approach where Electron and web clients can reuse domain, sync, and integration logic.

## 15. Suggested Tech Direction

### Application Stack

- Electron
- Vite
- React.js
- TanStack Router
- TanStack Form
- TanStack Query
- Zustand
- shadcn/ui
- Tailwind CSS
- date-fns
- React Day Picker

### Data Layer

- SQLite
- Drizzle ORM

### Runtime / Package Management

- Node.js
- bun

### Repository Strategy

- Single repository initially
- Potential migration to monorepo in the future if shared packages become necessary

## 16. Suggested High-Level Project Structure

A simple categorized folder structure is suitable for the current phase. Example high-level grouping:

- components
- pages
- lib
- utils
- helpers
- features
- services
- integrations
- db
- hooks
- stores
- types
- config

Over time, domain-specific separation can be introduced without forcing a monorepo too early.

## 17. Risks and Considerations

- Calendar provider support may vary in complexity, especially Apple/iCloud-related integration.
- Reminder behavior may differ by operating system, packaging, and browser/runtime environment.
- Notion sync can become complex due to flexible schemas and dynamic field mapping.
- Conflict resolution can become challenging once multiple writable sources are enabled.
- Slack integration should be designed as optional to avoid coupling reminder delivery too tightly to external systems.
- Optional cloud sync introduces auth, security, and infrastructure complexity.

## 18. Phased Roadmap

### Phase 1: Local-First MVP

- Electron app foundation
- Local calendar and task management
- SQLite + Drizzle setup
- Unified calendar UI
- In-app notifications
- Basic Notion integration
- Quick open links to Notion pages/databases
- Export/import of configuration

### Phase 2: External Calendar Integrations

- Google Calendar integration
- Outlook integration
- Additional provider support
- Improved sync engine
- Better reminder handling and scheduling

### Phase 3: Advanced Productivity Layer

- Dynamic Notion field mapping improvements
- Slack reminder integration
- Linked notes/task workflows
- Better task-event relationship support
- Richer reminder actions such as snooze and follow-up

### Phase 4: Optional Cloud Sync

- Auth system
- Sync integrations and connected accounts across devices
- Sync user preferences and configuration
- Restore setup on new devices with minimal effort

### Phase 5: Productization

- Integration marketplace direction
- Premium sync and convenience features
- Broader platform support including web
- Potential commercialization and team-oriented capabilities

## 19. Success Metrics

Initial success can be measured by:

- Users can manage core calendar and task workflows without leaving the app.
- Users can connect at least one calendar provider and Notion successfully.
- Reminders are reliably delivered while the app is active.
- Users can open linked Notion items quickly from task/event context.
- Export/import works smoothly across devices.

Longer-term success can be measured by:

- Number of connected integrations per user.
- Daily active usage for planning and reminders.
- Reminder engagement rate.
- Sync reliability and low conflict/error rates.
- Conversion to optional sync or paid features in the future.

## 20. Open Questions

- Which calendar providers will be included in the first release beyond Google?
- How deep should local calendar editing go before provider write-back is enabled?
- What is the first version of Notion sync: read-only, selective write-back, or two-way sync?
- What is the minimum export/import format needed for portability?
- Should notification scheduling run entirely in the Electron main process?
- When cloud sync is introduced, what data should remain local-only?

## 21. Summary

This product aims to become a unified, local-first calendar and task management application that combines personal scheduling, reminders, task planning, and external integrations into one fast desktop experience. The Electron app will serve as the main user workspace, while integrations with Notion, major calendar providers, and Slack will extend its utility. The architecture should remain modular, reusable, and future-ready so that optional cloud sync, web support, and commercialization can be introduced without rebuilding the core foundation.
