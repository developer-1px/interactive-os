/**
 * OS Default Keybindings — Pre-registered key→command mappings.
 *
 * Import this module to register the standard OS keybindings.
 * All bindings use `when: "navigating"` so they don't fire during Field editing.
 *
 * These map directly to commands from 3-commands/.
 */

import { ACTIVATE, ESCAPE, TAB, OS_DELETE, OS_MOVE_UP, OS_MOVE_DOWN } from "@os/3-commands/interaction";
import {
  FIELD_CANCEL,
  FIELD_COMMIT,
  FIELD_START_EDIT,
} from "@os/3-commands/field/field";
import { NAVIGATE } from "@os/3-commands/navigate";
import { SELECT } from "@os/3-commands/selection";
import { OS_COPY, OS_CUT, OS_PASTE } from "@os/3-commands/clipboard/clipboard";
import { Keybindings } from "./keybindings";

// ═══════════════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  {
    key: "ArrowDown",
    command: NAVIGATE,
    args: [{ direction: "down" }],
    when: "navigating",
  },
  {
    key: "ArrowUp",
    command: NAVIGATE,
    args: [{ direction: "up" }],
    when: "navigating",
  },
  {
    key: "ArrowLeft",
    command: NAVIGATE,
    args: [{ direction: "left" }],
    when: "navigating",
  },
  {
    key: "ArrowRight",
    command: NAVIGATE,
    args: [{ direction: "right" }],
    when: "navigating",
  },
  {
    key: "Home",
    command: NAVIGATE,
    args: [{ direction: "home" }],
    when: "navigating",
  },
  {
    key: "End",
    command: NAVIGATE,
    args: [{ direction: "end" }],
    when: "navigating",
  },

  // Shift+Arrow → range selection
  {
    key: "Shift+ArrowDown",
    command: NAVIGATE,
    args: [{ direction: "down", select: "range" }],
    when: "navigating",
  },
  {
    key: "Shift+ArrowUp",
    command: NAVIGATE,
    args: [{ direction: "up", select: "range" }],
    when: "navigating",
  },
]);

// ═══════════════════════════════════════════════════════════════════
// Tab
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  {
    key: "Tab",
    command: TAB,
    args: [{ direction: "forward" }],
    when: "navigating",
  },
  {
    key: "Shift+Tab",
    command: TAB,
    args: [{ direction: "backward" }],
    when: "navigating",
  },
]);

// ═══════════════════════════════════════════════════════════════════
// Activation & Escape
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Enter", command: ACTIVATE, when: "navigating" },
  { key: "Escape", command: ESCAPE, when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Selection
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  {
    key: "Space",
    command: SELECT,
    args: [{ mode: "toggle" }],
    when: "navigating",
  },
]);

// ═══════════════════════════════════════════════════════════════════
// Delete
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Backspace", command: OS_DELETE, when: "navigating" },
  { key: "Delete", command: OS_DELETE, when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Move (Reorder)
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Meta+ArrowUp", command: OS_MOVE_UP, when: "navigating" },
  { key: "Meta+ArrowDown", command: OS_MOVE_DOWN, when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Clipboard
// ═══════════════════════════════════════════════════════════════════

Keybindings.registerAll([
  { key: "Meta+C", command: OS_COPY, when: "navigating" },
  { key: "Meta+X", command: OS_CUT, when: "navigating" },
  { key: "Meta+V", command: OS_PASTE, when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Field Editing
// ═══════════════════════════════════════════════════════════════════
// Enter (editing) → commit and exit editing mode
// Escape (editing) → cancel and exit editing mode
// F2 (navigating) → start editing (standard OS pattern, avoids Enter conflict with ACTIVATE)

Keybindings.registerAll([
  { key: "Enter", command: FIELD_COMMIT, when: "editing" },
  { key: "Escape", command: FIELD_CANCEL, when: "editing" },
  { key: "F2", command: FIELD_START_EDIT, when: "navigating" },
]);

// ═══════════════════════════════════════════════════════════════════
// Expansion
// ═══════════════════════════════════════════════════════════════════
// ArrowRight/ArrowLeft expand/collapse is handled inline by NAVIGATE
// (W3C tree pattern). No separate keybindings needed.

