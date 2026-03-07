/**
 * Todo Trigger Click — Reproduction test
 *
 * Issue: Clicking trigger buttons (Edit, MoveUp, MoveDown, Delete)
 * inside todo items has no effect.
 *
 * These triggers are created via `TodoApp.createTrigger(command, { id })`:
 *   - "start-edit"    → startEdit({ id })
 *   - "move-item-up"  → moveItemUp({ id })
 *   - "move-item-down"→ moveItemDown({ id })
 *   - "delete-todo"   → deleteTodo({ id })
 *   - "toggle-todo"   → toggleTodo({ id })
 *
 * Expected: page.click("start-edit") dispatches the trigger's onActivate command.
 * Actual: no-op — trigger callbacks are not registered in headless mode.
 */

import { TodoApp } from "@apps/todo/app";
import { createHeadlessPage } from "@os-devtool/testing/page";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type P = AppPageInternal<any>;
let page: P;

import TodoPage from "../../../../src/pages/TodoPage";

beforeEach(() => {
  page = createHeadlessPage(TodoApp, TodoPage);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

describe("Trigger button click reproduction", () => {
  it("click 'start-edit' trigger should start editing", () => {
    // Focus a todo item first
    page.locator("#todo_1").click();
    expect(page.state.ui.editingId).toBeNull();

    // Click the Edit trigger button
    page.click("start-edit");

    // BUG: editingId should be "todo_1" but remains null
    expect(page.state.ui.editingId).toBe("todo_1");
  });

  it("click 'move-item-down' trigger should reorder", () => {
    page.locator("#todo_1").click();

    // Click the MoveDown trigger button
    page.click("move-item-down");

    // BUG: order should change but stays the same
    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");
  });

  it("click 'move-item-up' trigger should reorder", () => {
    page.locator("#todo_2").click();

    // Click the MoveUp trigger button
    page.click("move-item-up");

    // BUG: order should change but stays the same
    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");
  });

  it("click 'delete-todo' trigger should remove item", () => {
    page.locator("#todo_1").click();
    expect(page.state.data.todoOrder).toContain("todo_1");

    // Click the Delete trigger button (direct delete, not requestDeleteTodo)
    page.click("delete-todo");

    expect(page.state.data.todoOrder).not.toContain("todo_1");
    expect(page.state.data.todoOrder.length).toBe(3);
  });

  it("click 'toggle-todo' trigger should toggle completed", () => {
    page.locator("#todo_1").click();
    expect(page.state.data.todos.todo_1.completed).toBe(false);

    // Click the Toggle trigger button
    page.click("toggle-todo");

    // BUG: completed should flip but stays false
    expect(page.state.data.todos.todo_1.completed).toBe(true);
  });

  // Contrast: keyboard shortcuts DO work (proving the commands themselves are fine)
  it("keyboard Delete works (control)", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Delete");
    expect(page.state.ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("keyboard Meta+ArrowDown works (control)", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");
  });
});
