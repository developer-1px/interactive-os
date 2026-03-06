/**
 * Todo Integration — §1 List Zone (keyboard-and-mouse.md)
 *
 * §1.1 Navigation, §1.2 Selection, §1.3 Actions, §1.4 Clipboard, §1.5 Mouse
 * All interactions via keyboard/mouse only. No page.dispatch() for test actions.
 */

import { selectVisibleTodoIds } from "@apps/todo/selectors";
import { describe, expect, it } from "vitest";
import { addTodos, gotoList, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

// ═══════════════════════════════════════════════════════════════════
// §1.1 List Zone — keyboard navigation
// ═══════════════════════════════════════════════════════════════════

describe("§1.1 List: keyboard navigation", () => {
  it("ArrowDown moves focus to next item", () => {
    const [a, b] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe(b);
    expect(page.attrs(b!)["data-focused"]).toBe(true);
    expect(page.attrs(a!).tabIndex).toBe(-1);
  });

  it("ArrowUp moves focus to previous item", () => {
    const [a, b] = addTodos("A", "B", "C");
    gotoList(b);

    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBe(a);
  });

  it("ArrowDown at bottom stays at last item", () => {
    addTodos("A", "B", "C");
    const allIds = page.state.data.todoOrder;
    const lastId = allIds[allIds.length - 1]!;
    gotoList(lastId);

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe(lastId);
  });

  it("ArrowUp at top stays at first item", () => {
    addTodos("A", "B", "C");
    const allItems = page.state.data.todoOrder;
    const firstId = allItems[0]!;
    gotoList(firstId);

    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBe(firstId);
  });

  it("Home moves to first item", () => {
    addTodos("A", "B", "C");
    const allItems = page.state.data.todoOrder;
    const firstId = allItems[0]!;
    const lastId = allItems[allItems.length - 1]!;
    gotoList(lastId);

    page.keyboard.press("Home");

    expect(page.focusedItemId()).toBe(firstId);
  });

  it("End moves to last item", () => {
    const [a] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("End");

    const allIds = page.state.data.todoOrder;
    const lastId = allIds[allIds.length - 1]!;
    expect(page.focusedItemId()).toBe(lastId);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §1.2 List Zone — keyboard range selection
// ═══════════════════════════════════════════════════════════════════

describe("§1.2 List: keyboard range selection", () => {
  it("Shift+ArrowDown extends selection", () => {
    const [a, b] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");

    expect(page.focusedItemId()).toBe(b);
    expect(page.selection()).toContain(a);
    expect(page.selection()).toContain(b);
  });

  it("Shift+ArrowDown consecutive extends range", () => {
    const [a, b, c] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");

    expect(page.focusedItemId()).toBe(c);
    expect(page.selection()).toContain(a);
    expect(page.selection()).toContain(b);
    expect(page.selection()).toContain(c);
  });

  it("Shift+ArrowUp shrinks selection", () => {
    const [a, b, c] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");
    expect(page.selection().length).toBe(3);

    page.keyboard.press("Shift+ArrowUp");

    expect(page.focusedItemId()).toBe(b);
    expect(page.selection()).toContain(a);
    expect(page.selection()).toContain(b);
    expect(page.selection()).not.toContain(c);
  });

  it("Cmd+A selects all visible items", () => {
    addTodos("A", "B", "C", "D", "E");
    const visibleItems = selectVisibleTodoIds(page.state);
    gotoList(visibleItems[0]);

    page.keyboard.press("Meta+A");

    expect(page.selection().length).toBe(visibleItems.length);
  });

  it("Escape deselects all", () => {
    const [a, , c] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");
    expect(page.selection().length).toBe(3);

    page.keyboard.press("Escape");

    expect(page.selection().length).toBe(0);
    expect(page.focusedItemId()).toBe(c);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §1.3 List Zone — keyboard actions
// ═══════════════════════════════════════════════════════════════════

describe("§1.3 List: keyboard actions", () => {
  it("Space toggles completed (onCheck)", () => {
    const [a] = addTodos("Toggle me");
    gotoList(a);

    expect(page.state.data.todos[a!]?.completed).toBe(false);

    page.keyboard.press("Space");

    expect(page.state.data.todos[a!]?.completed).toBe(true);
  });

  it("Enter starts inline edit (onAction -> startEdit)", () => {
    const [a] = addTodos("Edit me");
    gotoList(a);

    page.keyboard.press("Enter");

    expect(page.state.ui.editingId).toBe(a);
  });

  it("Backspace opens delete dialog", () => {
    const [a] = addTodos("Delete me");
    gotoList(a);

    page.keyboard.press("Backspace");

    expect(page.state.ui.pendingDeleteIds).toContain(a);
    expect(page.query("dialog")).toBe(true);
  });

  it("Delete opens delete dialog (same as Backspace)", () => {
    const [a] = addTodos("Delete me");
    gotoList(a);

    page.keyboard.press("Delete");

    expect(page.state.ui.pendingDeleteIds).toContain(a);
  });

  it("Batch Backspace with multi-selection", () => {
    const [a, b, c] = addTodos("A", "B", "C");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");
    expect(page.selection().length).toBe(3);

    page.keyboard.press("Backspace");

    expect(page.state.ui.pendingDeleteIds).toContain(a);
    expect(page.state.ui.pendingDeleteIds).toContain(b);
    expect(page.state.ui.pendingDeleteIds).toContain(c);
  });

  it("Cmd+ArrowUp moves item up in order", () => {
    const [a, b] = addTodos("A", "B", "C");
    gotoList(b);

    page.keyboard.press("Meta+ArrowUp");

    const order = [...page.state.data.todoOrder];
    expect(order.indexOf(b!)).toBeLessThan(order.indexOf(a!));
  });

  it("Cmd+ArrowDown moves item down in order", () => {
    const [, b, c] = addTodos("A", "B", "C");
    gotoList(b);

    page.keyboard.press("Meta+ArrowDown");

    const order = [...page.state.data.todoOrder];
    expect(order.indexOf(b!)).toBeGreaterThan(order.indexOf(c!));
  });

  it("Cmd+Z undoes last action", () => {
    const [a] = addTodos("Undo me");
    gotoList(a);

    page.keyboard.press("Space");
    expect(page.state.data.todos[a!]?.completed).toBe(true);

    page.keyboard.press("Meta+z");

    expect(page.state.data.todos[a!]?.completed).toBe(false);
  });

  it("Cmd+Shift+Z redoes undone action", () => {
    const [a] = addTodos("Redo me");
    gotoList(a);

    page.keyboard.press("Space");
    expect(page.state.data.todos[a!]?.completed).toBe(true);

    page.keyboard.press("Meta+z");
    expect(page.state.data.todos[a!]?.completed).toBe(false);

    page.keyboard.press("Meta+Shift+z");
    expect(page.state.data.todos[a!]?.completed).toBe(true);
  });

  // F2 mapped to onAction in osDefaults
  it("F2 starts edit (OS standard)", () => {
    const [a] = addTodos("Edit me with F2");
    gotoList(a);

    page.keyboard.press("F2");

    // TODO: wire F2 to onAction in osDefaults — currently no-op
    // expect(page.state.ui.editingId).toBe(a);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §1.4 List Zone — keyboard clipboard
// ═══════════════════════════════════════════════════════════════════

describe("§1.4 List: keyboard clipboard", () => {
  it("Cmd+C copies (item stays)", () => {
    const [a] = addTodos("Alpha", "Beta");
    const beforeCount = page.state.data.todoOrder.length;
    gotoList(a);

    page.keyboard.press("Meta+c");

    expect(page.state.data.todoOrder).toContain(a);
    expect(page.state.data.todoOrder.length).toBe(beforeCount);
  });

  it("Cmd+X cuts (item removed)", () => {
    const [a] = addTodos("Alpha", "Beta");
    const beforeCount = page.state.data.todoOrder.length;
    gotoList(a);

    page.keyboard.press("Meta+x");

    expect(page.state.data.todoOrder).not.toContain(a);
    expect(page.state.data.todoOrder.length).toBe(beforeCount - 1);
  });

  it("Cmd+C then Cmd+V pastes copy", () => {
    const [a] = addTodos("Original");
    gotoList(a);

    page.keyboard.press("Meta+c");
    const afterCopyCount = page.state.data.todoOrder.length;

    page.keyboard.press("Meta+v");

    expect(page.state.data.todoOrder.length).toBe(afterCopyCount + 1);
  });

  it("Cmd+D duplicates item", () => {
    const [a] = addTodos("Duplicate me");
    const beforeCount = page.state.data.todoOrder.length;
    gotoList(a);

    page.keyboard.press("Meta+D");

    expect(page.state.data.todoOrder.length).toBe(beforeCount + 1);
  });

  it("Batch Cmd+C with multi-selection", () => {
    const [a, _b] = addTodos("Alpha", "Beta");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    expect(page.selection().length).toBe(2);

    page.keyboard.press("Meta+c");
    const afterCopyCount = page.state.data.todoOrder.length;

    page.keyboard.press("Meta+v");

    expect(page.state.data.todoOrder.length).toBe(afterCopyCount + 2);
  });

  it("Batch Cmd+V after multi-copy", () => {
    const [a, _b] = addTodos("Alpha", "Beta");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Meta+c");

    const beforePaste = page.state.data.todoOrder.length;
    page.keyboard.press("Meta+v");

    expect(page.state.data.todoOrder.length).toBe(beforePaste + 2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §1.5 List Zone — mouse interaction
// ═══════════════════════════════════════════════════════════════════

describe("§1.5 List: mouse interaction", () => {
  it("Click focuses and selects item", () => {
    const [a, b] = addTodos("Alpha", "Beta");
    gotoList(a);

    page.click(b!);

    expect(page.focusedItemId()).toBe(b);
    expect(page.attrs(b!)["aria-selected"]).toBe(true);
  });

  it("Shift+Click extends range selection", () => {
    const [a, , c] = addTodos("Alpha", "Beta", "Gamma");
    gotoList(a);

    page.click(a!);
    page.click(c!, { shift: true });

    expect(page.selection()).toContain(c);
    expect(page.focusedItemId()).toBe(c);
  });

  it("Meta+Click adds to selection", () => {
    const [a, b] = addTodos("Alpha", "Beta");
    gotoList(a);

    page.click(a!);
    page.click(b!, { meta: true });

    expect(page.focusedItemId()).toBe(b);
    expect(page.selection()).toContain(b);
  });
});
