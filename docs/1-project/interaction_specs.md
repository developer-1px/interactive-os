# Interaction Specification: Multi-Selection Patterns

**Last Updated:** 2026-02-20
**Status:** DRAFT (Pending Verification)

## Overview

This document specifies the supported multi-selection interactions within the Interaction OS, adhering to **WAI-ARIA Authoring Practices (APG)** for Listbox and Grid patterns where applicable. It explicitly defines behavior for modifier keys to ensure deterministic results.

## mouse Interaction Matrix

The following matrix defines the behavior of click interactions with modifier keys.

| Physical Trigger | Semantic Intent | APG Alignment | Behavior Description |
| :--- | :--- | :--- | :--- |
| **Click** | `replace` | Standard | Clears previous selection, selects the target item. |
| **Shift + Click** | `range` | ✅ Yes | Selects a contiguous range of items between the anchor (last focus) and the target. |
| **Cmd/Ctrl + Click** | `toggle` | ✅ Yes | Toggles the selection state of the target item without affecting other selected items. |
| **Alt + Click** | `replace` | (Explicit) | **Current Behavior:** Treated as a standard click (replaces selection). <br> *Note: Alt is not a standard modifier for listbox selection in APG. It is reserved for system functions or alternative actions.* |
| **Meta + A** | `all` | ✅ Yes | Selects all items within the active jurisdiction. |

## Keyboard Interaction Matrix

| Physical Trigger | Semantic Intent | APG Alignment | Behavior Description |
| :--- | :--- | :--- | :--- |
| **Space** | `toggle` | ✅ Yes | Toggles selection state of the focused item. |
| **Shift + Arrow** | `range` | ✅ Yes | Extends the selection range in the direction of movement. |
| **Arrow** | `replace` | Standard | Moves focus and selects the new item (in single-select mode or default multi-select). |

## Implementation Implementation

- **Handler:** `src/os/1-listeners/mouse/MouseListener.tsx`
- **Logic:** `src/os/1-listeners/mouse/resolveMouse.ts`
- **Tests:** `src/os/1-listeners/tests/unit/resolveMouse.test.ts`

### Notes on Alt Key
The `Alt` key is explicitly detected (`altKey: true`) in the input stream but currently resolves to `replace` mode to avoid conflicting with browser or OS defaults unless a specific domain requirement overrides it.
