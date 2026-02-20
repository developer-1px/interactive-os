/**
 * OS Default Keybindings — Pre-registered key→command mappings.
 *
 * Import this module to register the standard OS keybindings.
 * All bindings use `when: "navigating"` so they don't fire during Field editing.
 *
 * These map directly to commands from 3-commands/.
 */

import { OS_ESCAPE } from "@os/3-commands/dismiss";
import {
  OS_FIELD_CANCEL,
  OS_FIELD_COMMIT,
  OS_FIELD_START_EDIT,
} from "@os/3-commands/field/field";
import {
  OS_ACTIVATE,
  OS_DELETE,
  OS_MOVE_DOWN,
  OS_MOVE_UP,
  OS_REDO,
  OS_UNDO,
} from "@os/3-commands/interaction";
import { OS_NAVIGATE } from "@os/3-commands/navigate";
import { OS_SELECT, OS_SELECT_ALL } from "@os/3-commands/selection";
import { OS_TAB } from "@os/3-commands/tab";
import { Keybindings } from "./keybindings";

// ═══════════════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  {
    key: "ArrowDown",
    command: OS_NAVIGATE({ direction: "down" }),
    when: "navigating",
  },
  {
    key: "ArrowUp",
    command: OS_NAVIGATE({ direction: "up" }),
    when: "navigating",
  },
  {
    key: "ArrowLeft",
    command: OS_NAVIGATE({ direction: "left" }),
    when: "navigating",
  },
  {
    key: "ArrowRight",
    command: OS_NAVIGATE({ direction: "right" }),
    when: "navigating",
  },
  {
    key: "Home",
    command: OS_NAVIGATE({ direction: "home" }),
    when: "navigating",
  },
  {
    key: "End",
    command: OS_NAVIGATE({ direction: "end" }),
    when: "navigating",
  },

  // Shift+Arrow → range selection
  {
    key: "Shift+ArrowDown",
    command: OS_NAVIGATE({ direction: "down", select: "range" }),
    when: "navigating",
  },
  {
    key: "Shift+ArrowUp",
    command: OS_NAVIGATE({ direction: "up", select: "range" }),
    when: "navigating",
  },
]);

// ═══════════════════════════════════════════════════════════════════
// Tab
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Tab", command: OS_TAB({ direction: "forward" }), when: "navigating" },
  {
    key: "Shift+Tab",
    command: OS_TAB({ direction: "backward" }),
    when: "navigating",
  },
]);

// ═══════════════════════════════════════════════════════════════════
// Activation & Escape
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Enter", command: OS_ACTIVATE(), when: "navigating" },
  { key: "Escape", command: OS_ESCAPE(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Selection
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Space", command: OS_SELECT({ mode: "toggle" }), when: "navigating" },
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
// F2 (navigating) → start editing (standard OS pattern, avoids Enter conflict with OS_ACTIVATE)

Keybindings.registerAll([
  { key: "Enter", command: OS_FIELD_COMMIT(), when: "editing" },
  { key: "Escape", command: OS_FIELD_CANCEL(), when: "editing" },
  { key: "F2", command: OS_FIELD_START_EDIT(), when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Expansion
// ═══════════════════════════════════════════════════════════════════
// ArrowRight/ArrowLeft expand/collapse is handled inline by OS_NAVIGATE
// (W3C tree pattern). No separate keybindings needed.
