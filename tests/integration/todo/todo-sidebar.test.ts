/**
 * Todo Integration — §5 Sidebar Zone (keyboard-and-mouse.md)
 *
 * Navigation, Enter select, reorder, mouse click.
 * All interactions via keyboard/mouse only.
 */

import { describe, expect, it } from "vitest";
import { gotoSidebar, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("§5 Sidebar: keyboard", () => {
  it("ArrowDown — 카테고리 간 이동", () => {
    gotoSidebar();
    const cats = page.state.data.categoryOrder;
    const first = cats[0]!;
    const second = cats[1]!;

    expect(page.focusedItemId()).toBe(first);

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe(second);
  });

  it("ArrowUp — 카테고리 위로", () => {
    const cats = page.state.data.categoryOrder;
    gotoSidebar(cats[1]);

    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBe(cats[0]);
  });

  it("followFocus=true — 네비게이션이 선택도 변경", () => {
    gotoSidebar();
    const cats = page.state.data.categoryOrder;

    page.keyboard.press("ArrowDown");

    const focused = page.focusedItemId();
    expect(focused).toBe(cats[1]);
    expect(page.selection()).toContain(cats[1]);
  });

  it("Cmd+ArrowUp — 카테고리 순서 위로", () => {
    gotoSidebar();
    const cats = [...page.state.data.categoryOrder];
    // Focus on second category
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe(cats[1]);

    page.keyboard.press("Meta+ArrowUp");

    const newOrder = page.state.data.categoryOrder;
    expect(newOrder[0]).toBe(cats[1]);
    expect(newOrder[1]).toBe(cats[0]);
  });

  it("Cmd+ArrowDown — 카테고리 순서 아래로", () => {
    gotoSidebar();
    const cats = [...page.state.data.categoryOrder];
    // Focus on second category
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe(cats[1]);

    page.keyboard.press("Meta+ArrowDown");

    const newOrder = page.state.data.categoryOrder;
    expect(newOrder[1]).toBe(cats[2]);
    // cats[1] moved down
    expect(newOrder[2]).toBe(cats[1]);
  });

  it("Enter selects category (onAction)", () => {
    gotoSidebar();
    const cats = page.state.data.categoryOrder;

    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe(cats[1]);

    page.keyboard.press("Enter");

    expect(page.state.ui.selectedCategoryId).toBe(cats[1]);
  });

  it("Mouse click selects category", () => {
    gotoSidebar();
    const cats = page.state.data.categoryOrder;

    page.click(cats[2]!);

    expect(page.focusedItemId()).toBe(cats[2]);
    expect(page.state.ui.selectedCategoryId).toBe(cats[2]);
  });
});
