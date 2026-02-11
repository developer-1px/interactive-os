/**
 * OS Default Keybindings — Pre-registered key→command mappings.
 *
 * Import this module to register the standard OS keybindings.
 * All bindings use `when: "navigating"` so they don't fire during Field editing.
 *
 * These map directly to commands from 3-commands/.
 */

import { ACTIVATE } from "@os/3-commands/activate";
import { ESCAPE } from "@os/3-commands/escape";
import {
  FIELD_CANCEL,
  FIELD_COMMIT,
  FIELD_START_EDIT,
} from "@os/3-commands/field";
import { NAVIGATE } from "@os/3-commands/navigate";
import { SELECT } from "@os/3-commands/select";
import { TAB } from "@os/3-commands/tab";
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
