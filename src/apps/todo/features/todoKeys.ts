import type { TodoContext } from "@apps/todo/logic/schema";
import { OS } from "@os/features/AntigravityOS";
import type { KeymapConfig } from "@os/features/keyboard/lib/getCanonicalKey";
import { createLogicExpect, Rule } from "@os/features/logic/lib/Rule";

// Command Imports (Direct References)
// Note: Commands now handled by OS + Zone props:
// - ToggleTodo, DeleteTodo, StartEdit (via onSelect, onAction, onDelete)
// - CopyTodo, CutTodo, PasteTodo (via onCopy, onCut, onPaste)

import { DuplicateTodo } from "@apps/todo/features/commands/clipboard";
import {
  AddTodo,
  CancelEdit,
  MoveItemDown,
  MoveItemUp,
  StartEdit,
  UpdateTodoText,
} from "@apps/todo/features/commands/list";
import {
  MoveCategoryDown,
  MoveCategoryUp,
  SelectCategory,
} from "@apps/todo/features/commands/MoveCategoryUp";
import { ToggleView } from "@apps/todo/features/commands/ToggleView";

// 1. Strict Context Builders
const Expect = createLogicExpect<TodoContext>();

// 4. Default Keymap Definition (Hierarchical)
// Now using Direct Object References (CommandFactory) instead of string IDs.
// The OS Core (store.ts) resolves these objects to their .id automatically.
export const TODO_KEYMAP: KeymapConfig<any> = {
  global: [
    // App-Specific Global Commands
    { key: "Meta+Shift+V", command: ToggleView, allowInInput: true },

    // Note: Standard Navigation (Arrows, Tab) and OS Utilities (Inspector)
    // are now handled by the OS Registry via useOSCore.
  ],
  zones: {
    sidebar: [
      {
        key: "Meta+ArrowUp",
        command: MoveCategoryUp,
        when: Expect("activeZone").toBe("sidebar"),
      },
      {
        key: "Meta+ArrowDown",
        command: MoveCategoryDown,
        when: Expect("activeZone").toBe("sidebar"),
      },
      {
        key: "Enter",
        command: SelectCategory,
        args: { id: OS.FOCUS },
        when: Expect("activeZone").toBe("sidebar"),
      },
      {
        key: "Space",
        command: SelectCategory,
        args: { id: OS.FOCUS },
        when: Expect("activeZone").toBe("sidebar"),
      },
    ],

    listView: [
      // General Navigation

      // Structure - Reorder Items (Meta + Arrow)
      // Note: Meta+Arrows are reserved for "Move Item", not "Navigate Focus"
      {
        key: "Meta+ArrowUp",
        command: MoveItemUp,
        args: { focusId: OS.FOCUS },
        when: Expect("activeZone").toBe("listView"),
      },
      {
        key: "Meta+ArrowDown",
        command: MoveItemDown,
        args: { focusId: OS.FOCUS },
        when: Expect("activeZone").toBe("listView"),
      },

      // Creation (Strict Draft Guard)
      {
        key: "Enter",
        command: AddTodo,
        when: Rule.and(
          Expect("activeZone").toBe("listView"),
          Expect("isDraftFocused").toBe(true),
        ),
        allowInInput: true,
      },

      // Editing Triggers
      {
        key: "Enter",
        command: StartEdit,
        args: { id: OS.FOCUS },
        when: Rule.and(
          Expect("activeZone").toBe("listView"),
          Expect("isEditing").toBe(false),
          Expect("isDraftFocused").toBe(false),
        ),
      },
      {
        key: "Enter",
        command: UpdateTodoText,
        when: Rule.and(
          Expect("activeZone").toBe("listView"),
          Expect("isEditing").toBe(true),
        ),
        allowInInput: true,
      },
      {
        key: "Escape",
        command: CancelEdit,
        when: Rule.and(
          Expect("activeZone").toBe("listView"),
          Expect("isEditing").toBe(true),
        ),
        allowInInput: true,
      },

      // Space/Enter - handled by Zone's onSelect/onAction
      // Note: Space/Enter still go through keymap to dispatch OS_SELECT/OS_ACTIVATE,
      // which then trigger Zone's bound commands. This is the expected flow.

      // Backspace/Delete/Clipboard - NOW HANDLED BY OS + Zone props
      // The OS dispatches OS_DELETE/OS_COPY/etc, which FocusIntent routes to Zone's onDelete/onCopy/etc.
      // We keep Meta+D (Duplicate) here as it's not yet an OS-level standard.

      {
        key: "Meta+D",
        command: DuplicateTodo,
        args: { id: OS.FOCUS },
        when: Rule.and(
          Expect("activeZone").toBe("listView"),
          Expect("isEditing").toBe(false),
        ),
      },
    ],
    boardView: [
      // Space/Enter - handled by Zone's onSelect/onAction when BoardView is updated
      // Backspace/Delete/Clipboard - handled by OS + Zone props when BoardView is updated
      // For now, keeping Meta+D (Duplicate) as it's not yet an OS-level standard.
      {
        key: "Meta+D",
        command: DuplicateTodo,
        args: { id: OS.FOCUS },
        when: Rule.and(
          Expect("activeZone").toBe("boardView"),
          Expect("isEditing").toBe(false),
        ),
      },
    ],
  },
};
