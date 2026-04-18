# UI/UX Flow

## 🧭 1. Core UX Structure (High-Level Navigation)

### Primary Layout (Desktop App)

- **Left Sidebar (Primary Navigation)**
    - Today
    - Calendar
    - Tasks
    - Reminders
    - Notes (Notion quick access)
    - Integrations
    - Settings

- **Main Content Area**

- **Top Bar**
    - Global search
    - Quick add (+)
    - Sync status
    - Notifications

---

## 📄 2. Key Pages & Wireframes

### 🏠 2.1 Today Dashboard (Home)

**Goal:** Daily command center

**Sections:**

- Today’s Events (timeline view)
- Today’s Tasks
- Upcoming Reminders
- Quick Actions:
    -   - Add Task
    -   - Add Event
    -   - Quick Note (Notion)

**UX Notes:**

- Minimal, fast-loading
- Focus on “what matters now”

---

### 📅 2.2 Calendar Page

**Views:**

- Day / Week / Month / Agenda

**Features:**

- Unified events (all providers)
- Color-coded by source
- Drag & drop scheduling
- Event detail drawer (right panel)

**Event Drawer:**

- Title, time, calendar source
- Linked task / Notion page
- Reminder settings

---

### ✅ 2.3 Tasks Page

**Views:**

- List / Kanban (future)
- Filters: Today / Upcoming / Completed

**Task Item:**

- Title
- Due date
- Priority
- Status
- Linked Notion page

**Right Panel (Task Detail):**

- Notes preview (from Notion)
- Reminders
- Linked event

---

### ⏰ 2.4 Reminders Page

**Views:**

- Upcoming reminders
- Snoozed
- Completed

**Features:**

- Quick snooze
- Dismiss
- Source tracking (task/event/manual)

---

### 📝 2.5 Notes / Notion Quick Access

**Purpose:** Bridge, not editor

**Sections:**

- Connected databases
- Recent pages
- Quick open links

**Actions:**

- Open in Notion
- Link to task/event

---

### 🔌 2.6 Integrations Page

**Sections:**

- Calendar Providers
    - Google
    - Apple
    - Outlook

- Notion
- Slack

**Each Integration Card:**

- Status (Connected / Not)
- Last sync
- Configure button

---

### ⚙️ 2.7 Settings Page

Split into tabs:

---

## ⚙️ 3. Settings & Configuration

### 🧩 3.1 General

- Theme (light/dark)
- Default view (calendar/tasks)
- Timezone
- Start of week

---

### 📅 3.2 Calendar Settings

- Default calendar
- Event duration default
- Sync frequency
- Source priority (future conflict handling)

---

### ✅ 3.3 Task Settings

- Default priority
- Default reminder time
- Auto-link to calendar (optional)

---

### 🔔 3.4 Notifications

- Enable/disable notifications
- Reminder timing rules
- Snooze defaults
- Notification channels:
    - In-app
    - Slack (if connected)

---

### 🔌 3.5 Integrations Config

#### Calendar Providers

- Connect/disconnect
- Select calendars to sync
- Read/write permissions

#### Notion

- Select database(s)
- **Field Mapping UI:**
    - Title → Notion field
    - Due Date → field
    - Status → field
    - Reminder → field

#### Slack

- Workspace connect
- Channel selection
- Notification types

---

### 🔄 3.6 Sync & Data

- Manual sync trigger
- Sync logs (important)
- Conflict handling (future)

---

### 💾 3.7 Import / Export

- Export config
- Import config
- Backup status

---

### 🔐 3.8 Future: Account / Cloud Sync

- Sign in (optional)
- Sync devices
- Restore setup

---

## 🔄 4. Core UX Flows

### ✨ 4.1 Add Task Flow

1. Click “+”
2. Quick modal opens
3. Enter:
    - Title
    - Due date
    - Reminder

4. (Optional) Link Notion page
5. Save → appears in Today + Tasks

---

### 📅 4.2 Create Event Flow

1. Click calendar slot
2. Event modal/drawer opens
3. Add:
    - Title
    - Time
    - Calendar source

4. Add reminder
5. Save → sync (if provider)

---

### 🔌 4.3 Connect Integration Flow

1. Go to Integrations
2. Click “Connect”
3. OAuth flow
4. Select data (calendars / db)
5. Confirm → initial sync

---

### 🧠 4.4 Notion Mapping Flow (Critical UX)

1. Select database
2. Show fields list
3. Map fields via dropdown:
    - App Field → Notion Field

4. Save mapping
5. Preview sample data
6. Enable sync

---

### 🔔 4.5 Reminder Flow

1. Reminder triggers
2. Notification popup
3. Actions:
    - Open
    - Snooze
    - Dismiss

---

### 🔄 4.6 Export / Import Flow

**Export:**

- Settings → Export → file download

**Import:**

- Upload file → validate → apply config

---

## 🧱 5. Component-Level Wireframe Blocks

Reusable UI blocks:

- Calendar Grid
- Task List Item
- Right Drawer (universal detail panel)
- Integration Card
- Field Mapping Table
- Notification Toast
- Sync Status Indicator
- Quick Add Modal

---

## 🎯 6. UX Priorities (Important)

From your PRD , these must guide design:

- ⚡ Fast daily workflow (Today page is critical)
- 🔗 Seamless Notion linking
- 🔌 Clean modular integrations
- 🔔 Reliable reminders (core value)
- 🧠 Minimal friction UX (avoid complexity upfront)
