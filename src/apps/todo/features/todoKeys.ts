import type { KeymapConfig } from "@os/core/input/keybinding";
import type { TodoCommandId } from "@apps/todo/model/todoTypes";
import { createLogicExpect, createLogicRule } from "@apps/todo/logic/builder";
import type { TodoContext } from "@apps/todo/logic/schema";

// 1. Strict Context Builders
const Expect = createLogicExpect<TodoContext>();
const Rule = createLogicRule<TodoContext>();

// 4. Default Keymap Definition (Hierarchical)
export const TODO_KEYMAP: KeymapConfig<TodoCommandId> = {
  global: [
    { key: "Meta+z", command: "UNDO", allowInInput: true },
    { key: "Meta+Shift+Z", command: "REDO", allowInInput: true },
    { key: "Meta+Shift+V", command: "TOGGLE_VIEW", allowInInput: true },

    // Universal Navigation
    { key: "ArrowUp", command: "NAVIGATE_UP", allowInInput: true },
    { key: "ArrowDown", command: "NAVIGATE_DOWN", allowInInput: true },
    { key: "ArrowLeft", command: "NAVIGATE_LEFT", allowInInput: true },
    { key: "ArrowRight", command: "NAVIGATE_RIGHT", allowInInput: true },
  ],
  zones: {
    sidebar: [
      { key: "Meta+ArrowUp", command: "MOVE_CATEGORY_UP" },
      { key: "Meta+ArrowDown", command: "MOVE_CATEGORY_DOWN" },
      { key: "Enter", command: "SELECT_CATEGORY" },
      { key: "Space", command: "SELECT_CATEGORY" },
      // Navigation lifted to global
    ],
    listView: [
      // Navigation lifted to global

      // Structure
      { key: "Meta+ArrowUp", command: "MOVE_ITEM_UP" },
      { key: "Meta+ArrowDown", command: "MOVE_ITEM_DOWN" },

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
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Delete",
        command: "DELETE_TODO",
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Space",
        command: "TOGGLE_TODO",
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
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Backspace",
        command: "DELETE_TODO",
        when: Expect("isEditing").toBe(false),
      },
      {
        key: "Delete",
        command: "DELETE_TODO",
        when: Expect("isEditing").toBe(false),
      },
    ],
  },
};
