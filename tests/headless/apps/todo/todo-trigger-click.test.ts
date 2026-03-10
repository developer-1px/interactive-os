/**
 * Todo App — Trigger Click Tests (Headless)
 *
 * Tests trigger buttons via `page.click("trigger-id")`.
 * page: Playwright-subset API. os: kernel singleton for state inspection.
 *
 * Zero Drift: headless `page.click(triggerId)` = browser button click.
 */

import { TodoApp } from "@apps/todo/app";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { createPage } from "@os-devtool/testing/page";
import { os } from "@os-core/engine/kernel";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../src/apps/todo/model/appState";
import type { Page } from "@os-devtool/testing/types";

import TodoPage from "../../../../src/pages/TodoPage";

let page: Page;
let cleanup: () => void;

const state = () => os.getState().apps[TodoApp.__appId] as AppState;

beforeEach(() => {
  ({ page, cleanup } = createPage(TodoApp, TodoPage));
  page.goto("/");
});

afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// §22 Trigger Click — per-button dispatch
// ═══════════════════════════════════════════════════════════════════

describe("§22 Trigger click: per-button dispatch", () => {
  it("start-edit trigger starts editing focused item", () => {
    page.click("todo_1");
    expect(state().ui.editingId).toBeNull();

    page.click("StartEdit");

    expect(state().ui.editingId).toBe("todo_1");
  });

  it("move-item-down trigger reorders focused item down", () => {
    page.click("todo_1");

    page.click("MoveItemDown");

    expect(state().data.todoOrder[0]).toBe("todo_2");
    expect(state().data.todoOrder[1]).toBe("todo_1");
  });

  it("move-item-up trigger reorders focused item up", () => {
    page.click("todo_2");

    page.click("MoveItemUp");

    expect(state().data.todoOrder[0]).toBe("todo_2");
    expect(state().data.todoOrder[1]).toBe("todo_1");
  });

  it("delete-todo trigger removes focused item", () => {
    page.click("todo_1");
    expect(state().data.todoOrder).toContain("todo_1");

    page.click("DeleteTodo");

    expect(state().data.todoOrder).not.toContain("todo_1");
    expect(state().data.todoOrder.length).toBe(3);
  });

  it("toggle-todo trigger toggles completed", () => {
    page.click("todo_1");
    expect(state().data.todos["todo_1"]!.completed).toBe(false);

    page.click("ToggleTodo");

    expect(state().data.todos["todo_1"]!.completed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §23 Trigger click — focusId targeting
// ═══════════════════════════════════════════════════════════════════

describe("§23 Trigger click: focusId targeting", () => {
  it("delete-todo targets the focused item, not first/last", () => {
    page.click("todo_3");

    page.click("DeleteTodo");

    expect(state().data.todoOrder).not.toContain("todo_3");
    expect(state().data.todoOrder).toContain("todo_1");
    expect(state().data.todoOrder).toContain("todo_2");
  });

  it("sequential deletes target each focused item", () => {
    page.click("todo_2");
    page.click("DeleteTodo");
    expect(state().data.todoOrder).not.toContain("todo_2");

    page.click("todo_4");
    page.click("DeleteTodo");
    expect(state().data.todoOrder).not.toContain("todo_4");

    expect(state().data.todoOrder.length).toBe(2);
  });

  it("start-edit targets the focused item specifically", () => {
    page.click("todo_3");
    page.click("StartEdit");
    expect(state().ui.editingId).toBe("todo_3");
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
    page.click("todo_1");
    page.keyboard.press("Delete");
    expect(state().ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("trigger delete-todo removes directly (no confirm dialog)", () => {
    page.click("todo_1");
    page.click("DeleteTodo");
    expect(state().data.todoOrder).not.toContain("todo_1");
  });

  it("keyboard Meta+ArrowDown reorders same as trigger", () => {
    page.click("todo_1");
    page.keyboard.press("Meta+ArrowDown");
    expect(state().data.todoOrder[0]).toBe("todo_2");
    expect(state().data.todoOrder[1]).toBe("todo_1");
  });
});
