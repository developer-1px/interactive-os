import type { TodoCommandId } from "@apps/todo/model/todoTypes";
import { createLogicExpect, Rule } from "@os/core/logic/builder";
import type { TodoContext } from "@apps/todo/logic/schema";

const Expect = createLogicExpect<TodoContext>();

export interface MenuItem {
  command: TodoCommandId;
  when?: any; // LogicNode
}

// 1. Sidebar Menu (Availability Rules)
export const SIDEBAR_MENU: MenuItem[] = [
  {
    command: "MOVE_CATEGORY_UP",
    when: Rule.and(
      Expect("activeZone").toBe("sidebar"),
      Expect("focusIndex").toBeGreaterThan(0),
    ),
  },
  {
    command: "MOVE_CATEGORY_DOWN",
    when: Rule.and(
      Expect("activeZone").toBe("sidebar"),
      Expect("focusIndex").toBeLessThanKey("maxIndex"),
    ),
  },
  {
    command: "NAVIGATE_UP",
    when: Rule.and(
      Expect("activeZone").toBe("sidebar"),
      Expect("focusIndex").toBeGreaterThan(0),
    ),
  },
  {
    command: "NAVIGATE_DOWN",
    when: Rule.and(
      Expect("activeZone").toBe("sidebar"),
      Expect("focusIndex").toBeLessThanKey("maxIndex"),
    ),
  },
  { command: "SELECT_CATEGORY", when: Expect("activeZone").toBe("sidebar") },
  { command: "JUMP_TO_LIST", when: Expect("activeZone").toBe("sidebar") },
  { command: "UNDO" },
  { command: "REDO" },
  { command: "PATCH" },
  { command: "SET_FOCUS" },
];

// 2. TodoList Menu
export const TODOLIST_MENU: MenuItem[] = [
  {
    command: "ADD_TODO",
    when: Rule.and(
      Expect("isDraftFocused").toBeTruthy(),
      Expect("hasDraft").toBeTruthy(),
    ),
  },
  { command: "IMPORT_TODOS" },
  {
    command: "TOGGLE_TODO",
    when: Rule.and(
      Expect("activeZone").toBe("todoList"),
      Expect("focusIndex").toBeGreaterThanOrEqual(0),
    ),
  },
  {
    command: "DELETE_TODO",
    when: Rule.and(
      Expect("activeZone").toBe("todoList"),
      Expect("focusIndex").toBeGreaterThanOrEqual(0),
    ),
  },
  {
    command: "NAVIGATE_UP",
    when: Expect("isEditing").toBeFalsy(),
  },
  {
    command: "NAVIGATE_DOWN",
    when: Expect("isEditing").toBeFalsy(),
  },
  {
    command: "MOVE_ITEM_UP",
    when: Rule.and(
      Expect("activeZone").toBe("todoList"),
      Expect("focusIndex").toBeGreaterThan(0),
    ),
  },
  {
    command: "MOVE_ITEM_DOWN",
    when: Rule.and(
      Expect("activeZone").toBe("todoList"),
      Expect("focusIndex").toBeLessThanKey("maxIndex"),
    ),
  },
  {
    command: "START_EDIT",
    when: Rule.and(
      Expect("activeZone").toBe("todoList"),
      Expect("focusIndex").toBeGreaterThanOrEqual(0),
    ),
  },

  { command: "SYNC_DRAFT" },
  { command: "SYNC_EDIT_DRAFT" },
  {
    command: "CANCEL_EDIT",
    when: Expect("isEditing").toBeTruthy(),
  },
  {
    command: "UPDATE_TODO_TEXT",
    when: Expect("isEditing").toBeTruthy(),
  },
  { command: "UNDO" },
  { command: "REDO" },
  { command: "PATCH" },
  { command: "SET_FOCUS" },
];

// 3. Global Menu
export const GLOBAL_MENU: MenuItem[] = [
  { command: "UNDO" },
  { command: "REDO" },
  { command: "PATCH" },
  { command: "SET_FOCUS" },
];
