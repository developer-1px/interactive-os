# Unified Navigation Architecture & Focusable Zones (2026-02-03)

## Overview
This update consolidates Antigravity OS's navigation logic into a single, command-centric pipeline. It resolves the "Area Gap" in complex hierarchical layouts (like Kanban boards) by introducing **Focusable Zones** and moving physics logic from the hardware layer (`InputEngine`) to the logic layer (`CommandRegistry`).

## Key Changes

### 1. Focusable Zones (`OS.Zone`)
Zones can now act as both jurisdictional boundaries and focusable items.
- **`focusable` prop**: When enabled, the Zone renders with a `data-item-id`, making it reachable by spatial/roving navigation.
- **Self-Identity**: A focusable zone can receive focus, allowing users to select empty columns or entire regions for group actions.
- **Hierarchical Context**: `setFocus` now automatically resolves the `activeZoneId` and `focusPath` based on the item's location in the registry.

### 2. Command-Centric Physics (`osRegistry.ts`)
Previously, navigation physics (bubbling/deep-dive) resided in `InputEngine.tsx`. This was opaque to the Inspector and difficult to customize.
- **`NAVIGATE` Command**: Now contains the hierarchical traversal logic.
  - **Bubbling**: If navigation hits a boundary, it bubbles up the `focusPath` to the next available Zone.
  - **Deep-Dive**: When entering a Zone (like moving into a Kanban column), it automatically focuses the last-focused child or the first item.
- **Telemetry**: All navigation is now visible in the Inspector as first-class commands.

### 3. Middleware De-duplication
Redundant navigation logic was removed from `navigationMiddleware.ts` to prevent double-execution errors. The OS now handles the "how" of moving focus, while the app layer handles business-logic side effects.

### 4. Hardware Layer Simplification (`InputEngine.tsx`)
The `InputEngine` is now a pure "Input-to-Intent" emitter.
- It no longer contains physics code.
- It maps physical keys to commands using the Registry.
- It handles IME safety and input guards.

## Workflow Example: Kanban Board
1. User presses `ArrowRight` on a card in Column A.
2. `InputEngine` emits `OS_COMMANDS.NAVIGATE { direction: 'RIGHT' }`.
3. `osRegistry` attempts internal spatial navigation within Column A (fails).
4. `osRegistry` bubbles up to the 'Board' Zone.
5. Board Zone finds Column B (a focusable Zone).
6. Board Zone "Deep-Dives" into Column B and focuses the first card.
7. Inspector logs: `NAVIGATE (RIGHT) -> SUCCESS (Target: card-b1)`.

## Impact
- **Zero Overhead**: Logic is centralized, reducing cognitive debt for app developers.
- **High Telemetry**: Every navigation step is auditable via the OS Inspector.
- **Recursive Integrity**: Nested layouts (Zones within Zones) work out-of-the-box with standard bubbling.
