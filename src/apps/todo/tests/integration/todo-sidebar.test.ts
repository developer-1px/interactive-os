/**
 * Todo BDD — §5 Sidebar Zone: 키보드 네비게이션
 *
 * Split from todo-bdd.test.ts for maintainability.
 * Uses getItems() for headless DOM_ITEMS — no manual items needed.
 */

import { describe, expect, it } from "vitest";
import { gotoSidebar, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

// ═══════════════════════════════════════════════════════════════════
// §5 Sidebar Zone — 키보드 네비게이션
// ═══════════════════════════════════════════════════════════════════

describe("§5 Sidebar: 키보드 네비게이션", () => {
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
});
