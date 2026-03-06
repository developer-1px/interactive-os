/**
 * Todo Integration — ARIA attribute verification (keyboard-and-mouse.md)
 *
 * Verifies ARIA attributes on list items and sidebar items.
 */

import { describe, expect, it } from "vitest";
import { addTodos, gotoList, gotoSidebar, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("ARIA: List attributes", () => {
  it("Focused item has tabIndex=0 and data-focused=true", () => {
    const [a, b] = addTodos("Alpha", "Beta");
    gotoList(a);

    expect(page.attrs(a!).tabIndex).toBe(0);
    expect(page.attrs(a!)["data-focused"]).toBe(true);
    expect(page.attrs(b!).tabIndex).toBe(-1);
    expect(page.attrs(b!)["data-focused"]).toBeUndefined();
  });

  it("Selected item has aria-selected=true", () => {
    const [a, b] = addTodos("Alpha", "Beta");
    gotoList(a);

    page.click(b!);

    expect(page.attrs(b!)["aria-selected"]).toBe(true);
    expect(page.attrs(a!)["aria-selected"]).toBe(false);
  });

  it("Completed item reflects completed state after Space", () => {
    const [a] = addTodos("Check me");
    gotoList(a);

    page.keyboard.press("Space");

    expect(page.state.data.todos[a!]?.completed).toBe(true);
  });
});

describe("ARIA: Sidebar attributes", () => {
  it("Selected category has aria-selected=true (followFocus)", () => {
    gotoSidebar();
    const cats = page.state.data.categoryOrder;

    page.keyboard.press("ArrowDown");

    expect(page.attrs(cats[1]!)["aria-selected"]).toBe(true);
  });
});
