# Low Fidelity Wire Frames

## 🏠 1. Today Dashboard

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Search | + Add | Sync | Notifications              │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Today                                       │
│               │                                             │
│ • Today       │ ┌───────────────┐ ┌───────────────┐         │
│ • Calendar    │ │ Today's       │ │ Tasks         │         │
│ • Tasks       │ │ Events        │ │               │         │
│ • Reminders   │ │ 9AM Meeting   │ │ [ ] Task 1    │         │
│ • Notes       │ │ 2PM Call      │ │ [ ] Task 2    │         │
│ • Integrations│ └───────────────┘ └───────────────┘         │
│ • Settings    │                                             │
│               │ ┌───────────────────────────────────────┐   │
│               │ │ Upcoming Reminders                    │   │
│               │ │ • Submit report (5 PM)                │   │
│               │ └───────────────────────────────────────┘   │
│               │                                             │
│               │ [+ Quick Add Task/Event]                    │
└───────────────┴─────────────────────────────────────────────┘
```

---

## 📅 2. Calendar View

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: View Switch (Day/Week/Month) | + Add Event         │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Calendar (Week View)                        │
│               │                                             │
│               │  Mon   Tue   Wed   Thu   Fri   Sat   Sun    │
│               │ ──────────────────────────────────────────  │
│               │ 9AM  [Meeting]                              │
│               │ 11AM       [Call]                           │
│               │ 2PM             [Review]                    │
│               │                                             │
│               │ (Drag & drop events)                        │
│               │                                             │
│               │ ┌───────────────────────────────┐           │
│               │ │ Event Detail Drawer           │           │
│               │ │ Title                         │           │
│               │ │ Time                          │           │
│               │ │ Reminder                      │           │
│               │ │ Linked Notion Page            │           │
│               │ └───────────────────────────────┘           │
└───────────────┴─────────────────────────────────────────────┘
```

---

## ✅ 3. Tasks Page

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Filters | + Add Task                               │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Tasks                                       │
│               │                                             │
│               │ Filters: [Today] [Upcoming] [Completed]     │
│               │                                             │
│               │ ┌───────────────────────────────────────┐   │
│               │ │ [ ] Task Title                        │   │
│               │ │ Due: Tomorrow | Priority: High        │   │
│               │ └───────────────────────────────────────┘   │
│               │                                             │
│               │ ┌───────────────────────────────────────┐   │
│               │ │ Task Detail Panel                     │   │
│               │ │ Title                                 │   │
│               │ │ Due Date                              │   │
│               │ │ Reminder                              │   │
│               │ │ Notion Link                           │   │
│               │ └───────────────────────────────────────┘   │
└───────────────┴─────────────────────────────────────────────┘
```

---

## ⏰ 4. Reminders Page

```text
┌─────────────────────────────────────────────────────────────┐
│ Reminders                                                   │
├─────────────────────────────────────────────────────────────┤
│ Upcoming                                                    │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Submit Report - 5:00 PM                               │   │
│ │ [Open] [Snooze] [Dismiss]                             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Snoozed                                                     │
│ Completed                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 5. Notion / Notes Bridge

```text
┌─────────────────────────────────────────────────────────────┐
│ Notes (Notion Integration)                                  │
├─────────────────────────────────────────────────────────────┤
│ Connected Databases                                         │
│ • Tasks DB                                                  │
│ • Notes DB                                                  │
│                                                             │
│ Recent Pages                                                │
│ • Project Plan                                              │
│ • Meeting Notes                                             │
│                                                             │
│ Actions:                                                    │
│ [Open in Notion] [Link to Task/Event]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 6. Integrations Page

```text
┌─────────────────────────────────────────────────────────────┐
│ Integrations                                                │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│ │ Google Cal    │  │ Notion        │  │ Slack         │     │
│ │ Connected     │  │ Connected     │  │ Not Connected │     │
│ │ [Configure]   │  │ [Configure]   │  │ [Connect]     │     │
│ └───────────────┘  └───────────────┘  └───────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 7. Settings (Tabbed)

```text
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                    │
├───────────────┬─────────────────────────────────────────────┤
│ Tabs          │ Content                                     │
│               │                                             │
│ • General     │ Theme: Light/Dark                           │
│ • Calendar    │ Default View: Week                          │
│ • Tasks       │                                             │
│ • Notifications│ Notifications: Enabled                     │
│ • Integrations│                                             │
│ • Sync        │ Last Sync: 2 mins ago                       │
│ • Import/Export                                             │
└───────────────┴─────────────────────────────────────────────┘
```

---

## 🔄 8. Notion Field Mapping (Important UX)

```text
┌─────────────────────────────────────────────────────────────┐
│ Notion Field Mapping                                        │
├─────────────────────────────────────────────────────────────┤
│ App Field        →   Notion Field                           │
│ ----------------------------------------------------------  │
│ Title            →   Name                                   │
│ Due Date         →   Deadline                               │
│ Status           →   Status                                 │
│ Reminder         →   Reminder Time                          │
│ Notes Link       →   URL                                    │
│                                                             │
│ [Save Mapping]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ➕ 9. Quick Add Modal

```text
┌──────────────────────────────┐
│ + Add                        │
├──────────────────────────────┤
│ Title                        │
│ Type: (Task / Event)         │
│ Date / Time                  │
│ Reminder                     │
│                              │
│ [Save] [Cancel]              │
└──────────────────────────────┘
```

---

## 🧠 Design Notes (Critical)

- Use **right-side drawer** everywhere for details (tasks, events)
- Keep **quick add extremely fast**
- Avoid deep navigation — everything should be 1–2 clicks
- Integration config should feel **modular, not overwhelming**
