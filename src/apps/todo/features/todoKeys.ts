import type { KeymapConfig } from "@os/features/input/lib/getCanonicalKey";
import { createLogicExpect, Rule } from "@os/features/logic/lib/Rule";
import type { TodoContext } from "@apps/todo/logic/schema";
import { OS } from "@os/features/AntigravityOS";

// Command Imports (Direct References)

import { ToggleView } from "@apps/todo/features/commands/ToggleView";
import {
  MoveCategoryUp,
  MoveCategoryDown,
  SelectCategory
} from "@apps/todo/features/commands/MoveCategoryUp";
import {
  AddTodo,
  ToggleTodo,
  DeleteTodo,
  MoveItemUp,
  MoveItemDown,
  StartEdit,
  CancelEdit,
  UpdateTodoText,
} from "@apps/todo/features/commands/list";
import {
  CopyTodo,
  CutTodo,
  PasteTodo,
  DuplicateTodo,
} from "@apps/todo/features/commands/clipboard";

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
      { key: "Meta+ArrowUp", command: MoveCategoryUp },
      { key: "Meta+ArrowDown", command: MoveCategoryDown },
      { key: "Enter", command: SelectCategory, args: { id: OS.FOCUS } },
      { key: "Space", command: SelectCategory, args: { id: OS.FOCUS } },
    ],

    listView: [
      // General Navigation


      // Structure - Reorder Items (Meta + Arrow)
      // Note: Meta+Arrows are reserved for "Move Item", not "Navigate Focus"
      { key: "Meta+ArrowUp", command: MoveItemUp, args: { focusId: OS.FOCUS } },
      { key: "Meta+ArrowDown", command: MoveItemDown, args: { focusId: OS.FOCUS } },

      // Creation (Strict Draft Guard)
      {
        key: "Enter",
        command: AddTodo,
        when: Expect("isDraftFocused").toBe(true),
        allowInInput: true,
      },

      // Editing Triggers
      {
        key: "Enter",
        command: StartEdit,
        args: { id: OS.FOCUS },
        when: Rule.and(
          Expect("isEditing").toBe(false),
          Expect("isDraftFocused").toBe(false),
        ),
      },
      {
        key: "Enter",
        command: UpdateTodoText,
        when: Expect("isEditing").toBe(true),
        allowInInput: true,
      },
      {
        key: "Escape",
        command: CancelEdit,
        when: Expect("isEditing").toBe(true),
        allowInInput: true,
      },

      // Deletion & Toggle (No Edit Guard)
      {
        key: "Backspace",
        command: DeleteTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Delete",
        command: DeleteTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Space",
        command: ToggleTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },

      // Clipboard Operations (No Edit Guard - should work when not editing)
      {
        key: "Meta+C",
        command: CopyTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Meta+X",
        command: CutTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Meta+V",
        command: PasteTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Meta+D",
        command: DuplicateTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
    ],
    boardView: [
      // Item Actions (Shared)
      {
        key: "Space",
        command: ToggleTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Backspace",
        command: DeleteTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Delete",
        command: DeleteTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },

      // Clipboard Operations
      {
        key: "Meta+C",
        command: CopyTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Meta+X",
        command: CutTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Meta+V",
        command: PasteTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Meta+D",
        command: DuplicateTodo,
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
    ],
  },
};
