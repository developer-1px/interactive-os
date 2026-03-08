/**
 * Todo App — Headless Integration Tests
 *
 * Tests the full user journey via Playwright-subset API only.
 * Each test: page.click/press/locator/expect → OS pipeline → ARIA state.
 */

import { confirmDeleteTodo, TodoApp } from "@apps/todo/app";
import { createHeadlessPage } from "@os-devtool/testing/page";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { _resetClipboardStore } from "@os-sdk/library/collection/createCollectionZone";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type P = AppPageInternal<any>;
let page: P;

import TodoPage from "../../../../src/pages/TodoPage";

beforeEach(() => {
  _resetClipboardStore();
  page = createHeadlessPage(TodoApp, TodoPage);
  page.goto("/"); // Playwright-compatible: registers all zones + renders component
});

afterEach(() => {
  page.cleanup();
});

/** Shorthand: assert locator is focused */
function expectFocused(selector: string) {
  expect(page.locator(selector).toBeFocused()).toBe(true);
}

/** Shorthand: assert locator ARIA attribute is truthy */
function expectSelected(selector: string) {
  expect(page.locator(selector).attrs["aria-selected"]).toBe(true);
}

/** Shorthand: assert locator ARIA attribute is falsy */
function expectNotSelected(selector: string) {
  expect(page.locator(selector).attrs["aria-selected"]).not.toBe(true);
}

// ═══════════════════════════════════════════════════════════════════
// §1 List Zone — Navigation
// ═══════════════════════════════════════════════════════════════════

describe("§1 List: navigation", () => {
  it("click focuses item", () => {
    page.locator("#todo_1").click();
    expectFocused("#todo_1");
  });

  it("ArrowDown moves focus", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("ArrowDown");
    expectFocused("#todo_2");
  });

  it("ArrowUp moves focus", () => {
    page.locator("#todo_2").click();
    page.keyboard.press("ArrowUp");
    expectFocused("#todo_1");
  });

  it("Home moves to first", () => {
    page.locator("#todo_3").click();
    page.keyboard.press("Home");
    expectFocused("#todo_1");
  });

  it("End moves to last", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("End");
    expectFocused("#todo_4");
  });

  it("ArrowDown at bottom clamps", () => {
    page.locator("#todo_4").click();
    page.keyboard.press("ArrowDown");
    expectFocused("#todo_4");
  });

  it("ArrowUp at top clamps", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("ArrowUp");
    expectFocused("#todo_1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §2 List Zone — Selection
// ═══════════════════════════════════════════════════════════════════

describe("§2 List: selection", () => {
  it("click selects item", () => {
    page.locator("#todo_1").click();
    expectSelected("#todo_1");
  });

  it("Shift+ArrowDown extends selection", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Shift+ArrowDown");
    expectSelected("#todo_1");
    expectSelected("#todo_2");
  });

  it("Meta+Click toggles individual selection", () => {
    page.locator("#todo_1").click();
    page.locator("#todo_3").click({ modifiers: ["Meta"] });
    expectSelected("#todo_1");
    expectSelected("#todo_3");
    // Toggle off
    page.locator("#todo_1").click({ modifiers: ["Meta"] });
    expectNotSelected("#todo_1");
  });

  it("Escape deselects all", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Escape");
    expectNotSelected("#todo_1");
    expectNotSelected("#todo_2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3 List Zone — Check (toggle completed)
// ═══════════════════════════════════════════════════════════════════

describe("§3 List: check", () => {
  it("Space toggles completed state", () => {
    page.locator("#todo_1").click();
    expect(page.state.data.todos.todo_1.completed).toBe(false);

    page.keyboard.press("Space");
    expect(page.state.data.todos.todo_1.completed).toBe(true);

    page.keyboard.press("Space");
    expect(page.state.data.todos.todo_1.completed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §4 List Zone — Clipboard
// ═══════════════════════════════════════════════════════════════════

describe("§4 List: clipboard", () => {
  it("Meta+C copies, Meta+V pastes (duplicate)", () => {
    page.locator("#todo_1").click();

    page.keyboard.press("Meta+c");
    page.keyboard.press("Meta+v");

    expect(page.state.data.todoOrder.length).toBe(5);
  });

  it("Meta+X cuts, Meta+V pastes (move)", () => {
    page.locator("#todo_1").click();

    page.keyboard.press("Meta+x");
    expect(page.state.data.todoOrder.length).toBe(3);

    page.keyboard.press("Meta+v");
    expect(page.state.data.todoOrder.length).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §5 List Zone — Reorder
// ═══════════════════════════════════════════════════════════════════

describe("§5 List: reorder", () => {
  it("Meta+ArrowDown moves item down", () => {
    page.locator("#todo_1").click();

    page.keyboard.press("Meta+ArrowDown");

    const order = page.state.data.todoOrder;
    expect(order[0]).toBe("todo_2");
    expect(order[1]).toBe("todo_1");
  });

  it("Meta+ArrowUp moves item up", () => {
    page.locator("#todo_2").click();

    page.keyboard.press("Meta+ArrowUp");

    const order = page.state.data.todoOrder;
    expect(order[0]).toBe("todo_2");
    expect(order[1]).toBe("todo_1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §6 List Zone — Delete
// ═══════════════════════════════════════════════════════════════════

describe("§6 List: delete", () => {
  it("Delete sets pendingDeleteIds", () => {
    page.locator("#todo_1").click();

    page.keyboard.press("Delete");

    // Todo app opens confirm dialog — pendingDeleteIds is set
    expect(page.state.ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("confirmDeleteTodo removes item from order", () => {
    page.locator("#todo_1").click();

    page.keyboard.press("Delete");
    page.dispatch(confirmDeleteTodo());

    expect(page.state.data.todoOrder).not.toContain("todo_1");
    expect(page.state.data.todoOrder.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §7 List Zone — Undo/Redo
// ═══════════════════════════════════════════════════════════════════

describe("§7 List: undo/redo", () => {
  it("Meta+Z undoes confirmed delete", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Delete");
    page.dispatch(confirmDeleteTodo());

    expect(page.state.data.todoOrder.length).toBe(3);

    page.keyboard.press("Meta+z");

    expect(page.state.data.todoOrder.length).toBe(4);
    expect(page.state.data.todoOrder).toContain("todo_1");
  });

  it("Meta+Shift+Z redoes after undo", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Delete");
    page.dispatch(confirmDeleteTodo());
    page.keyboard.press("Meta+z");

    expect(page.state.data.todoOrder.length).toBe(4);

    page.keyboard.press("Meta+Shift+z");

    expect(page.state.data.todoOrder.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §8 Sidebar Zone — Category navigation + followFocus selection
// ═══════════════════════════════════════════════════════════════════

describe("§8 Sidebar: navigation + selection", () => {
  it("click focuses and selects category", () => {
    page.locator("#cat_inbox").click();
    expectFocused("#cat_inbox");
    expectSelected("#cat_inbox");
  });

  it("ArrowDown moves focus with followFocus selection", () => {
    page.locator("#cat_inbox").click();
    page.keyboard.press("ArrowDown");
    expectFocused("#cat_work");
    expectSelected("#cat_work");
    expectNotSelected("#cat_inbox");
  });

  it("ArrowUp moves focus backwards", () => {
    page.locator("#cat_work").click();
    page.keyboard.press("ArrowUp");
    expectFocused("#cat_inbox");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §9 Draft Zone — Add todo via keyboard
// ═══════════════════════════════════════════════════════════════════

describe("§9 Draft: add todo", () => {
  it("type text + Enter adds a new todo", () => {
    // Headless-only workaround: clicking a field doesn't trigger OS_FOCUS in current OS simulator
    page.dispatch({
      type: "OS_FOCUS",
      payload: { zoneId: "draft", itemId: null },
    } as any);
    page.keyboard.type("New headless task");
    page.keyboard.press("Enter");

    const todos = Object.values(page.state.data.todos);
    expect(todos.some((t: any) => t.text === "New headless task")).toBe(true);
    expect(page.state.data.todoOrder.length).toBe(5);
  });
});
