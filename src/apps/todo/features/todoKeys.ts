import type { KeymapConfig } from "@os/core/input/keybinding";
import type { TodoCommandId } from "@apps/todo/model/types";
import { createLogicExpect, Rule } from "@os/core/logic/builder";
import type { TodoContext } from "@apps/todo/logic/schema";
import { OS } from "@os/core/context";
import { OS_COMMANDS } from "@os/core/command/osCommands";

// 1. Strict Context Builders
const Expect = createLogicExpect<TodoContext>();

// 4. Default Keymap Definition (Hierarchical)
export const TODO_KEYMAP: KeymapConfig<TodoCommandId> = {
  global: [
    { key: "Meta+z", command: OS_COMMANDS.UNDO, allowInInput: true },
    { key: "Meta+Shift+Z", command: OS_COMMANDS.REDO, allowInInput: true },
    { key: "Meta+Shift+V", command: "TOGGLE_VIEW", allowInInput: true },
    { key: "Meta+i", command: OS_COMMANDS.TOGGLE_INSPECTOR, allowInInput: true },


    // Universal Navigation
    { key: "ArrowUp", command: OS_COMMANDS.NAVIGATE, args: { direction: "UP" }, allowInInput: true },
    { key: "ArrowDown", command: OS_COMMANDS.NAVIGATE, args: { direction: "DOWN" }, allowInInput: true },
    { key: "ArrowLeft", command: OS_COMMANDS.NAVIGATE, args: { direction: "LEFT" }, allowInInput: true },
    { key: "ArrowRight", command: OS_COMMANDS.NAVIGATE, args: { direction: "RIGHT" }, allowInInput: true },
  ],
  zones: {
    sidebar: [
      { key: "Meta+ArrowUp", command: "MOVE_CATEGORY_UP" },
      { key: "Meta+ArrowDown", command: "MOVE_CATEGORY_DOWN" },
      { key: "Enter", command: "SELECT_CATEGORY", args: { id: OS.FOCUS } },
      { key: "Space", command: "SELECT_CATEGORY", args: { id: OS.FOCUS } },
      // Navigation lifted to global
    ],

    listView: [
      // Navigation lifted to global

      // Structure
      { key: "Meta+ArrowUp", command: "MOVE_ITEM_UP", args: { focusId: OS.FOCUS } },
      { key: "Meta+ArrowDown", command: "MOVE_ITEM_DOWN", args: { focusId: OS.FOCUS } },

      // Creation (Strict Draft Guard)
      {
        key: "Enter",
        command: "ADD_TODO",
        when: Expect("isDraftFocused").toBe(true),
        allowInInput: true,
      },

      // Editing Triggers
      {
        key: "Enter",
        command: "START_EDIT",
        args: { id: OS.FOCUS },
        when: Rule.and(
          Expect("isEditing").toBe(false),
          Expect("isDraftFocused").toBe(false),
        ),
      },
      {
        key: "Enter",
        command: "UPDATE_TODO_TEXT",
        when: Expect("isEditing").toBe(true),
        allowInInput: true,
      },
      {
        key: "Escape",
        command: "CANCEL_EDIT",
        when: Expect("isEditing").toBe(true),
        allowInInput: true,
      },

      // Deletion & Toggle (No Edit Guard)
      {
        key: "Backspace",
        command: "DELETE_TODO",
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Delete",
        command: "DELETE_TODO",
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Space",
        command: "TOGGLE_TODO",
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },

      // Cross-Zone: Handled by Zone Declarative Neighbors

    ],
    boardView: [
      // Navigation lifted to global

      // Column Navigation (Handled by Zone Neighbors Declaratively)
      // ArrowRight/Left falls through to Zone Spatial Nav

      // Item Actions (Shared)
      {
        key: "Space",
        command: "TOGGLE_TODO",
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Backspace",
        command: "DELETE_TODO",
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Delete",
        command: "DELETE_TODO",
        args: { id: OS.FOCUS },
        when: Expect("isEditing").toBe(false),
      },
    ],
  },
};
