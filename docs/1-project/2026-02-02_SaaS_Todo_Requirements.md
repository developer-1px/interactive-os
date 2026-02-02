# SaaS Todo App Requirements Checklist

To evolve our "Reference Implementation" into a complete "Commercial SaaS Product" (like Todoist, Things 3, Linear), we need to address the following functional and non-functional requirements.

## 1. Core Data & Hierarchy (The "Noun" Layer)
- [ ] **Nested Tasks (Subtasks)**
    - Infinite or multi-level depth (Task > Subtask > Substep).
    - Progress roll-up (Parent completes when children complete?).
- [ ] **Smart Recurring Tasks**
    - "Every Monday", "Last day of month", "3 days after completion".
    - Logic for handling "overdue" recurring instances.
- [ ] **Rich Descriptions & Attachments**
    - Markdown support in notes.
    - File attachments/images.
    - URL preview expansions.
- [ ] **Multi-Select & Bulk Actions**
    - Shift-click selection.
    - Bulk move, complete, delete, rescheduling.

## 2. Organization & Workflow (The "Adjective" Layer)
- [ ] **Flexible Tagging / Labels**
    - Many-to-many relationship.
    - Color coding.
- [ ] **Filtering & Smart Views**
    - "Today", "Upcoming", "Someday/Maybe".
    - Custom Query Language (e.g., `(due:today | (p1 & !tag:waiting))`).
- [ ] **Workspaces / Projects / Areas**
    - Separation of "Work" vs "Personal" contexts (Data Isolation).
    - Shared vs Private lists.

## 3. Interaction & Views (The "Verb" Layer)
- [ ] **Multiple View Layouts**
    - **List View**: Standard vertical list.
    - **Kanban Board**: Status/Category columns.
    - **Calendar View**: Monthly/Weekly grid.
    - **Gantt/Timeline**: Dependency visualization.
- [ ] **Quick Add (Global Capture)**
    - System-wide hotkey to capture task without switching context.
    - NLP Parsing ("Buy milk tomorrow at 5pm #personal").
- [ ] **Drag & Drop Reordering**
    - Cross-list dragging.
    - Indent/Outdent via drag.

## 4. Collaboration (The "Social" Layer)
- [ ] **Real-time Sync**
    - CRDT (Conflict-free Replicated Data Types) or Optimistic UI.
    - Presence indicators (Who is looking at this list?).
- [ ] **Comments & Activity Log**
    - Audit trail (Who changed due date?).
    - @Mentions and notifications.
- [ ] **Sharing Permissions**
    - Viewer / Editor / Admin roles.

## 5. Intelligence & Automation
- [ ] **Reminders & Notifications**
    - Push notifications, Email digests.
    - Location-based reminders.
- [ ] **Automations**
    - "When task added to 'Bug', assign to @engineer".
    - "Archive completed tasks after 7 days".

## 6. Technical Engineering Mandates (Antigravity Standards)
- [ ] **Offline-First (Local-First)**
    - App must work perfectly with 0 network.
    - Background sync when online.
- [ ] **Performance Budget**
    - Lists with 10,000 items must scroll at 60fps (Virtualization).
    - < 100ms interaction latency for any local action.
- [ ] **Keyboard-First Navigation**
    - Every single action must be accessible via keyboard (current strength).
    - Palette Command interface (`Cmd+K`).
