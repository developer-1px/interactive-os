# Red Team Audit: `src/lib/todo_keys.ts`

**Date**: 2026-02-02
**Target**: `src/lib/todo_keys.ts`
**Auditor**: Antigravity (Red Team)
**Status**: Critical Findings Detected

---

## Executive Summary
The `todo_keys.ts` file acts as the central input configuration for the application. While currently functional, it exhibits **High Fragility** due to loose typing and **Implicit Logic** regarding command jurisdiction. The reliance on runtime string evaluation for command dispatch creates a "Silent Failure" minefield where typos in command IDs or context predicates will not be caught by the active compiler.

## Critical Findings

### 1. 🚨 Type Safety Failure: Loose Command Strings
**Severity**: High
**Location**: `KeybindingItem[]` definition (Line 7)

The explicit type `KeybindingItem[]` effectively casts the `command` property to `string`. This bypasses the Type System entirely for command IDs.
- **Risk**: A typo such as `command: 'ADD_TODOO'` will compile successfully but fail silently at runtime.
- **Violation**: Violates the "AI First" principle of strict compile-time validation.
- **Recommendation**: 
    1. Update `KeybindingItem` interface to be generic: `interface KeybindingItem<T = string> { command: T; ... }`.
    2. Import the `TodoCommandId` union from `todo_commands.ts` (inferred from the registry).
    3. Define the map as `const TODO_KEYMAP: KeybindingItem<TodoCommandId>[]`.

### 2. ⚠️ Implicit Jurisdiction & Conflict Hazards
**Severity**: Medium
**Location**: Overlapping Keys (Lines 13 vs 32)

The file defines `Meta+ArrowUp` twice:
```typescript
// Line 13 (Sidebar Section)
{ key: 'Meta+ArrowUp', command: 'MOVE_CATEGORY_UP' }, 

// Line 32 (Item Manipulation Section)
{ key: 'Meta+ArrowUp', command: 'MOVE_ITEM_UP' },
```
Neither entry has a `when` clause in this file. The system currently relies on "Implicit Inheritance" — waiting for the runtime to merge the *Command Definition's* `when` clause (e.g., `activeZone == 'sidebar'`) into the keybinding.
- **Risk**: This makes `todo_keys.ts` unreliable as a source of truth. A developer reading this file sees a conflict. If the Command Definition's guard logic changes (e.g., removing the zone check for testing), the Input Layer instantly breaks or shadows lower-priority keys without warning.
- **Recommendation**: "Context Locality". Add explicit `when` clauses to `todo_keys.ts` to strictly delimit where these keys apply.
    - Line 13: `when: 'activeZone == "sidebar"'`
    - Line 32: `when: 'activeZone == "todoList"'`

### 3. ⚠️ "Stringly-Typed" Logic Predicates
**Severity**: Medium
**Location**: All `when` clauses

Predicates are raw strings (e.g., `'activeZone == "sidebar"'`).
- **Risk**: If the `activeZone` state property is renamed (e.g., to `focusedZone`), or if the value "sidebar" changes to "SIDEBAR", these clauses will fail silently. The `LogicBuilder` pattern used in `todo_commands.ts` (`Expect('activeZone')...`) provides some runtime validation, but these strings are opaque.
- **Recommendation**: 
    - **Minimum**: Unit tests that parse and validate all `when` strings against the schema.
    - **Ideal**: Use a template-literal type or a helper builder to construct these strings safely.

### 4. ℹ️ Inconsistent "Input Guard" usage
**Severity**: Low
**Location**: Global vs Local checks

- `JUMP_TO_SIDEBAR` (Line 29) *correctly* defines a view-layer input guard: `when: '!isEditing || cursorAtStart'`. This is a Best Practice (keeping input friction logic in the keybinding).
- However, other commands like `DELETE_TODO` (Line 22) include business logic in the keybinding: `when: 'activeZone == "todoList" && !isEditing'`.
- **Refactoring Opportunity**: Standardize "Where does the guard live?".
    - **Jurisdiction (Zone)**: Should be in Keybinding (to allow key reuse).
    - **Business State (Has Draft)**: Should be solely in Command.
    - **Input State (Cursor)**: Should be in Keybinding.
    - Current state is mixed.

## Action Plan

1.  **Strict Typing**: Create a `types` file to export `TodoCommandId` and apply it to this file immediately.
2.  **Explicit Context**: Patch `todo_keys.ts` to add `when: 'activeZone == "..."'` to all zone-specific keys.
3.  **Validation**: Verify that `MOVE_CATEGORY_UP` and `MOVE_ITEM_UP` correctly switch based on focus.

---
*End of Report*
