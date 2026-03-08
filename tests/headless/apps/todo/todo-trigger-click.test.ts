/**
 * Todo App — Trigger Click Tests (Headless)
 *
 * Tests trigger buttons via `page.click("trigger-id")`.
 * Each trigger is declared in bind({ triggers: { Name: callback } }):
 *   - "StartEdit"     → startEdit({ id: focusId })
 *   - "MoveItemUp"    → moveItemUp({ id: focusId })
 *   - "MoveItemDown"  → moveItemDown({ id: focusId })
 *   - "DeleteTodo"    → deleteTodo({ id: focusId })
 *   - "ToggleTodo"    → toggleTodo({ id: focusId })
 *
 * Zero Drift: headless `page.click(triggerId)` = browser button click.
 */

import { TodoApp } from "@apps/todo/app";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { createHeadlessPage } from "@os-devtool/testing/page";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../src/apps/todo/model/appState";

type P = AppPageInternal<AppState>;
let page: P;

import TodoPage from "../../../../src/pages/TodoPage";

beforeEach(() => {
  page = createHeadlessPage(TodoApp, TodoPage);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// §22 Trigger Click — per-button dispatch
// ═══════════════════════════════════════════════════════════════════

describe("§22 Trigger click: per-button dispatch", () => {
  it("start-edit trigger starts editing focused item", () => {
    page.locator("#todo_1").click();
    expect(page.state.ui.editingId).toBeNull();

    page.click("StartEdit");

    expect(page.state.ui.editingId).toBe("todo_1");
  });

  it("move-item-down trigger reorders focused item down", () => {
    page.locator("#todo_1").click();

    page.click("MoveItemDown");

    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");
  });

  it("move-item-up trigger reorders focused item up", () => {
    page.locator("#todo_2").click();

    page.click("MoveItemUp");

    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");
  });

  it("delete-todo trigger removes focused item", () => {
    page.locator("#todo_1").click();
    expect(page.state.data.todoOrder).toContain("todo_1");

    page.click("DeleteTodo");

    expect(page.state.data.todoOrder).not.toContain("todo_1");
    expect(page.state.data.todoOrder.length).toBe(3);
  });

  it("toggle-todo trigger toggles completed", () => {
    page.locator("#todo_1").click();
    expect(page.state.data.todos["todo_1"]!.completed).toBe(false);

    page.click("ToggleTodo");

    expect(page.state.data.todos["todo_1"]!.completed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §23 Trigger click — focusId targeting
// ═══════════════════════════════════════════════════════════════════

describe("§23 Trigger click: focusId targeting", () => {
  it("delete-todo targets the focused item, not first/last", () => {
    page.locator("#todo_3").click();

    page.click("DeleteTodo");

    expect(page.state.data.todoOrder).not.toContain("todo_3");
    expect(page.state.data.todoOrder).toContain("todo_1");
    expect(page.state.data.todoOrder).toContain("todo_2");
  });

  it("sequential deletes target each focused item", () => {
    page.locator("#todo_2").click();
    page.click("DeleteTodo");
    expect(page.state.data.todoOrder).not.toContain("todo_2");

    page.locator("#todo_4").click();
    page.click("DeleteTodo");
    expect(page.state.data.todoOrder).not.toContain("todo_4");

    expect(page.state.data.todoOrder.length).toBe(2);
  });

  it("start-edit targets the focused item specifically", () => {
    page.locator("#todo_3").click();
    page.click("StartEdit");
    expect(page.state.ui.editingId).toBe("todo_3");
  });

  it("onActivate in ZoneRegistry is a function using focusId", () => {
    const cb = ZoneRegistry.findItemCallback("DeleteTodo");
    expect(cb?.onActivate).toBeTruthy();

    const cmd1 = cb!.onActivate!("todo_1");
    const cmd2 = cb!.onActivate!("todo_3");
    expect(cmd1).not.toEqual(cmd2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §24 Trigger click vs keyboard — parity check
// ═══════════════════════════════════════════════════════════════════

describe("§24 Trigger click vs keyboard: parity", () => {
  it("keyboard Delete sets pendingDeleteIds (request flow)", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Delete");
    expect(page.state.ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("trigger delete-todo removes directly (no confirm dialog)", () => {
    page.locator("#todo_1").click();
    page.click("DeleteTodo");
    expect(page.state.data.todoOrder).not.toContain("todo_1");
  });

  it("keyboard Meta+ArrowDown reorders same as trigger", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Meta+ArrowDown");
    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");
  });
});
