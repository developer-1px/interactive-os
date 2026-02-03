# Architecture: Logic & Command System

## 1. The Command System
The Command System decouples "What to do" from "How it's triggered" and "Who triggers it".

### A. Permissive Dispatch & Headless Execution
- **Principle**: "UI is Cautious, Engine is Productive".
- **UI Gatekeepers**: Keybindings and Buttons must check `when` conditions (e.g., "Is focus in sidebar?") before allowing a trigger.
- **Headless Engine**: `dispatch()` does not strictly enforce `when` clauses if called programmatically. This allows for headless automation, initialization, and macro execution without "faking" UI state.
- **Internal Guards**: The `run` function implements "Safety Guards" (e.g., checking for null data) to prevent crashes, separate from UX Rules.

### B. Intent-Based Commands
We distinguish between explicit User Intent and implicit System Action.
- **Commands**: Explicit user navigation (Arrow keys, Jump-to) should be Commands (e.g., `SELECT_ITEM`, `MOVE_CURSOR`).
- **Internal Side-Effects**: Implicit adjustments (auto-focusing after delete) should be handled by the middleware or reactive layers, not by dispatching new commands.

## 2. Focus System: Reactive Integrity
Focus management is a system-level invariant, not a manual task for every command.

### A. Self-Healing Focus
A central middleware (`ensureFocusIntegrity`) monitors state changes at the reducer level.
- **Behavior**: If the currently focused item is deleted or filtered out, the system automatically "heals" the focus by moving it to the nearest valid neighbor.
- **Benefit**: Commands like `DELETE_TODO` can be pure data operations without worrying about UI focus state.

## 3. Context & Virtual Physics
To support headless automation (running without a DOM), we rely on **Computed Context**.

### A. Virtual Physics Layer
Instead of reading from the DOM (`document.activeElement`, `clientWidth`), we derive "Physical" information from the pure state.
- **Projection**: `visibleOrder.indexOf(id)` replaces `domNode.getBoundingClientRect()`.
- **Computed Context**: All environmental information required for `when` conditions (e.g., `isFirstItem`, `listLength`) is projected from the state into a flat `Context` map.

### B. Condition Registry
Logical checks are centralized as **Named Conditions** (e.g., `hasSelectedItems`).
- **Observability**: The Inspector can show exactly why a "Delete" shortcut is disabled based on these named conditions.
