/**
 * OS Default Keybindings — Pre-registered key→command mappings.
 *
 * Import this module to register the standard OS keybindings.
 * All bindings use `when: "navigating"` so they don't fire during Field editing.
 *
 * These map directly to commands from 3-commands/.
 */

import {
  FIELD_CANCEL,
  FIELD_COMMIT,
  FIELD_START_EDIT,
} from "@os/3-commands/field/field";
import {
  ACTIVATE,
  ESCAPE,
  OS_DELETE,
  OS_MOVE_DOWN,
  OS_MOVE_UP,
  OS_REDO,
  OS_UNDO,
  TAB,
} from "@os/3-commands/interaction";
import { NAVIGATE } from "@os/3-commands/navigate";
import { OS_SELECT_ALL, SELECT } from "@os/3-commands/selection";
import { Keybindings } from "./keybindings";

// ═══════════════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "ArrowDown", command: NAVIGATE({ direction: "down" }), when: "navigating" },
  { key: "ArrowUp", command: NAVIGATE({ direction: "up" }), when: "navigating" },
  { key: "ArrowLeft", command: NAVIGATE({ direction: "left" }), when: "navigating" },
  { key: "ArrowRight", command: NAVIGATE({ direction: "right" }), when: "navigating" },
  { key: "Home", command: NAVIGATE({ direction: "home" }), when: "navigating" },
  { key: "End", command: NAVIGATE({ direction: "end" }), when: "navigating" },

  // Shift+Arrow → range selection
  { key: "Shift+ArrowDown", command: NAVIGATE({ direction: "down", select: "range" }), when: "navigating" },
  { key: "Shift+ArrowUp", command: NAVIGATE({ direction: "up", select: "range" }), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Tab
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Tab", command: TAB({ direction: "forward" }), when: "navigating" },
  { key: "Shift+Tab", command: TAB({ direction: "backward" }), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Activation & Escape
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Enter", command: ACTIVATE(), when: "navigating" },
  { key: "Escape", command: ESCAPE(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Selection
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Space", command: SELECT({ mode: "toggle" }), when: "navigating" },
  { key: "Meta+A", command: OS_SELECT_ALL(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Delete
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Backspace", command: OS_DELETE(), when: "navigating" },
  { key: "Delete", command: OS_DELETE(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Move (Reorder)
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Meta+ArrowUp", command: OS_MOVE_UP(), when: "navigating" },
  { key: "Meta+ArrowDown", command: OS_MOVE_DOWN(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Undo / Redo
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Meta+Z", command: OS_UNDO(), when: "navigating" },
  { key: "Meta+Shift+Z", command: OS_REDO(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Clipboard — handled by ClipboardListener (native copy/cut/paste events)
// NOT registered as keybindings to preserve native clipboard behavior.
// ClipboardListener checks zone state and only overrides when app
// explicitly provides onCopy/onCut/onPaste callbacks.
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// Field Editing
// ═══════════════════════════════════════════════════════════════════
// Enter (editing) → commit and exit editing mode
// Escape (editing) → cancel and exit editing mode
// F2 (navigating) → start editing (standard OS pattern, avoids Enter conflict with ACTIVATE)

Keybindings.registerAll([
  { key: "Enter", command: FIELD_COMMIT(), when: "editing" },
  { key: "Escape", command: FIELD_CANCEL(), when: "editing" },
  { key: "F2", command: FIELD_START_EDIT(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Expansion
// ═══════════════════════════════════════════════════════════════════
// ArrowRight/ArrowLeft expand/collapse is handled inline by NAVIGATE
// (W3C tree pattern). No separate keybindings needed.
