import type { KeymapConfig } from "@os/features/input/lib/getCanonicalKey";
import { createLogicExpect, Rule } from "@os/features/logic/lib/Rule";
import type { TodoContext } from "@apps/todo/logic/schema";
import { OS } from "@os/features/AntigravityOS";

// Command Imports (Direct References)
import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
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

// 1. Strict Context Builders
const Expect = createLogicExpect<TodoContext>();

// 4. Default Keymap Definition (Hierarchical)
// Now using Direct Object References (CommandFactory) instead of string IDs.
// The OS Core (store.ts) resolves these objects to their .id automatically.
export const TODO_KEYMAP: KeymapConfig<any> = {
  global: [
    { key: "Meta+Shift+V", command: ToggleView, allowInInput: true },
    { key: "Meta+I", command: "OS_TOGGLE_INSPECTOR", allowInInput: true },

    // Standard OS Navigation (Global Fallback)
    { key: "ArrowUp", command: OS_COMMANDS.NAVIGATE, args: { direction: "UP" }, allowInInput: true },
    { key: "ArrowDown", command: OS_COMMANDS.NAVIGATE, args: { direction: "DOWN" }, allowInInput: true },
    { key: "ArrowLeft", command: OS_COMMANDS.NAVIGATE, args: { direction: "LEFT" } },
    { key: "ArrowRight", command: OS_COMMANDS.NAVIGATE, args: { direction: "RIGHT" } },

    // Tab Navigation (Zone-aware)
    { key: "Tab", command: OS_COMMANDS.TAB },
    { key: "Shift+Tab", command: OS_COMMANDS.TAB_PREV },
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
    ],
  },
};
