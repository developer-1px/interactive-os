/**
 * Todo App — Headless Integration Tests
 *
 * Tests the full user journey via page + os singleton.
 * page: Playwright-subset API for navigation/interaction.
 * os: kernel singleton for state inspection and app command dispatch.
 */

import { confirmDeleteTodo, TodoApp } from "@apps/todo/app";
import { createPage } from "@os-devtool/testing/page";
import { expect as osExpect } from "@os-devtool/testing/expect";
import { os } from "@os-core/engine/kernel";
import { _resetClipboardStore } from "@os-sdk/library/collection/createCollectionZone";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../src/apps/todo/model/appState";
import type { Page } from "@os-devtool/testing/types";

import TodoPage from "../../../../src/pages/TodoPage";

let page: Page;
let cleanup: () => void;

const state = () => os.getState().apps[TodoApp.__appId] as AppState;

beforeEach(() => {
  _resetClipboardStore();
  ({ page, cleanup } = createPage(TodoApp, TodoPage));
  page.goto("/");
});

afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// §1 List Zone — Navigation
// ═══════════════════════════════════════════════════════════════════

describe("§1 List: navigation", () => {
  it("click focuses item", async () => {
    page.click("todo_1");
    await osExpect(page.locator("#todo_1")).toBeFocused();
  });

  it("ArrowDown moves focus", async () => {
    page.click("todo_1");
    page.keyboard.press("ArrowDown");
    await osExpect(page.locator("#todo_2")).toBeFocused();
  });

  it("ArrowUp moves focus", async () => {
    page.click("todo_2");
    page.keyboard.press("ArrowUp");
    await osExpect(page.locator("#todo_1")).toBeFocused();
  });

  it("Home moves to first", async () => {
    page.click("todo_3");
    page.keyboard.press("Home");
    await osExpect(page.locator("#todo_1")).toBeFocused();
  });

  it("End moves to last", async () => {
    page.click("todo_1");
    page.keyboard.press("End");
    await osExpect(page.locator("#todo_4")).toBeFocused();
  });

  it("ArrowDown at bottom clamps", async () => {
    page.click("todo_4");
    page.keyboard.press("ArrowDown");
    await osExpect(page.locator("#todo_4")).toBeFocused();
  });

  it("ArrowUp at top clamps", async () => {
    page.click("todo_1");
    page.keyboard.press("ArrowUp");
    await osExpect(page.locator("#todo_1")).toBeFocused();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §2 List Zone — Selection
// ═══════════════════════════════════════════════════════════════════

describe("§2 List: selection", () => {
  it("click selects item", async () => {
    page.click("todo_1");
    await osExpect(page.locator("#todo_1")).toHaveAttribute("aria-selected", "true");
  });

  it("Shift+ArrowDown extends selection", async () => {
    page.click("todo_1");
    page.keyboard.press("Shift+ArrowDown");
    await osExpect(page.locator("#todo_1")).toHaveAttribute("aria-selected", "true");
    await osExpect(page.locator("#todo_2")).toHaveAttribute("aria-selected", "true");
  });

  it("Meta+Click toggles individual selection", async () => {
    page.click("todo_1");
    page.locator("#todo_3").click({ modifiers: ["Meta"] });
    await osExpect(page.locator("#todo_1")).toHaveAttribute("aria-selected", "true");
    await osExpect(page.locator("#todo_3")).toHaveAttribute("aria-selected", "true");
    // Toggle off
    page.locator("#todo_1").click({ modifiers: ["Meta"] });
    await osExpect(page.locator("#todo_1")).not.toHaveAttribute("aria-selected", "true");
  });

  it("Escape deselects all", async () => {
    page.click("todo_1");
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Escape");
    await osExpect(page.locator("#todo_1")).not.toHaveAttribute("aria-selected", "true");
    await osExpect(page.locator("#todo_2")).not.toHaveAttribute("aria-selected", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3 List Zone — Check (toggle completed)
// ═══════════════════════════════════════════════════════════════════

describe("§3 List: check", () => {
  it("Space toggles completed state", () => {
    page.click("todo_1");
    expect(state().data.todos["todo_1"]!.completed).toBe(false);

    page.keyboard.press("Space");
    expect(state().data.todos["todo_1"]!.completed).toBe(true);

    page.keyboard.press("Space");
    expect(state().data.todos["todo_1"]!.completed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §4 List Zone — Clipboard
// ═══════════════════════════════════════════════════════════════════

describe("§4 List: clipboard", () => {
  it("Meta+C copies, Meta+V pastes (duplicate)", () => {
    page.click("todo_1");

    page.keyboard.press("Meta+c");
    page.keyboard.press("Meta+v");

    expect(state().data.todoOrder.length).toBe(5);
  });

  it("Meta+X cuts, Meta+V pastes (move)", () => {
    page.click("todo_1");

    page.keyboard.press("Meta+x");
    expect(state().data.todoOrder.length).toBe(3);

    page.keyboard.press("Meta+v");
    expect(state().data.todoOrder.length).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §5 List Zone — Reorder
// ═══════════════════════════════════════════════════════════════════

describe("§5 List: reorder", () => {
  it("Meta+ArrowDown moves item down", () => {
    page.click("todo_1");

    page.keyboard.press("Meta+ArrowDown");

    const order = state().data.todoOrder;
    expect(order[0]).toBe("todo_2");
    expect(order[1]).toBe("todo_1");
  });

  it("Meta+ArrowUp moves item up", () => {
    page.click("todo_2");

    page.keyboard.press("Meta+ArrowUp");

    const order = state().data.todoOrder;
    expect(order[0]).toBe("todo_2");
    expect(order[1]).toBe("todo_1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §6 List Zone — Delete
// ═══════════════════════════════════════════════════════════════════

describe("§6 List: delete", () => {
  it("Delete sets pendingDeleteIds", () => {
    page.click("todo_1");

    page.keyboard.press("Delete");

    expect(state().ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("confirmDeleteTodo removes item from order", () => {
    page.click("todo_1");

    page.keyboard.press("Delete");
    os.dispatch(confirmDeleteTodo());

    expect(state().data.todoOrder).not.toContain("todo_1");
    expect(state().data.todoOrder.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §7 List Zone — Undo/Redo
// ═══════════════════════════════════════════════════════════════════

describe("§7 List: undo/redo", () => {
  it("Meta+Z undoes confirmed delete", () => {
    page.click("todo_1");
    page.keyboard.press("Delete");
    os.dispatch(confirmDeleteTodo());

    expect(state().data.todoOrder.length).toBe(3);

    page.keyboard.press("Meta+z");

    expect(state().data.todoOrder.length).toBe(4);
    expect(state().data.todoOrder).toContain("todo_1");
  });

  it("Meta+Shift+Z redoes after undo", () => {
    page.click("todo_1");
    page.keyboard.press("Delete");
    os.dispatch(confirmDeleteTodo());
    page.keyboard.press("Meta+z");

    expect(state().data.todoOrder.length).toBe(4);

    page.keyboard.press("Meta+Shift+z");

    expect(state().data.todoOrder.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §8 Sidebar Zone — Category navigation + followFocus selection
// ═══════════════════════════════════════════════════════════════════

describe("§8 Sidebar: navigation + selection", () => {
  it("click focuses and selects category", async () => {
    page.click("cat_inbox");
    await osExpect(page.locator("#cat_inbox")).toBeFocused();
    await osExpect(page.locator("#cat_inbox")).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowDown moves focus with followFocus selection", async () => {
    page.click("cat_inbox");
    page.keyboard.press("ArrowDown");
    await osExpect(page.locator("#cat_work")).toBeFocused();
    await osExpect(page.locator("#cat_work")).toHaveAttribute("aria-selected", "true");
    await osExpect(page.locator("#cat_inbox")).not.toHaveAttribute("aria-selected", "true");
  });

  it("ArrowUp moves focus backwards", async () => {
    page.click("cat_work");
    page.keyboard.press("ArrowUp");
    await osExpect(page.locator("#cat_inbox")).toBeFocused();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §9 Draft Zone — Add todo via keyboard
// ═══════════════════════════════════════════════════════════════════

describe("§9 Draft: add todo", () => {
  it("type text + Enter adds a new todo", () => {
    os.dispatch({
      type: "OS_FOCUS",
      payload: { zoneId: "draft", itemId: null },
    });
    page.keyboard.type("New headless task");
    page.keyboard.press("Enter");

    const todos = Object.values(state().data.todos);
    expect(todos.some((t) => t.text === "New headless task")).toBe(true);
    expect(state().data.todoOrder.length).toBe(5);
  });
});
