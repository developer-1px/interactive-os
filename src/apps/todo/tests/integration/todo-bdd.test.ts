/**
 * Todo BDD Integration — keyboard-and-mouse.md 시나리오
 *
 * BDD spec (docs/6-products/todo/spec/keyboard-and-mouse.md)을
 * TodoApp.createPage() 기반 headless integration test로 구현.
 *
 * "사용자 입력 레벨" BDD: 어떤 키를 누르면 무슨 일이 일어나야 하는가?
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    TodoApp,
    addTodo,
    visibleTodos,
    copyTodo,
    cutTodo,
    pasteTodo,
    selectCategory,
} from "@apps/todo/app";
import type { TestPage } from "@os/defineApp.types";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";

type TodoState = ReturnType<typeof TodoApp.create>["state"];
type Page = TestPage<TodoState>;

let page: Page;

let now = 1000;

beforeEach(() => {
    vi.spyOn(Date, "now").mockImplementation(() => ++now);
    _resetClipboardStore();
    page = TodoApp.createPage();
});

afterEach(() => {
    page.cleanup();
});

/** Helper: add N todos and return their IDs */
function addTodos(...texts: string[]): string[] {
    for (const text of texts) {
        page.dispatch(addTodo({ text }));
    }
    return [...page.state.data.todoOrder];
}

/** Helper: goto list zone with current todo items */
function gotoList(focusedItemId?: string | null) {
    const ids = page.state.data.todoOrder;
    page.goto("list", { items: ids, focusedItemId: focusedItemId ?? ids[0] ?? null });
}

// ═══════════════════════════════════════════════════════════════════
// 1. List Zone — 키보드 네비게이션
// ═══════════════════════════════════════════════════════════════════

describe("§1.1 List: 키보드 네비게이션", () => {
    it("ArrowDown — 다음 항목으로 포커스 이동", () => {
        const [a, b] = addTodos("A", "B", "C");
        gotoList(a);

        page.keyboard.press("ArrowDown");

        expect(page.focusedItemId()).toBe(b);
        expect(page.attrs(b!)["data-focused"]).toBe(true);
        expect(page.attrs(a!).tabIndex).toBe(-1);
    });

    it("ArrowUp — 이전 항목으로 포커스 이동", () => {
        const [a, b] = addTodos("A", "B", "C");
        gotoList(b);

        page.keyboard.press("ArrowUp");

        expect(page.focusedItemId()).toBe(a);
    });

    it("ArrowDown at bottom — 경계에서 멈춤", () => {
        addTodos("A", "B", "C");
        const allIds = page.state.data.todoOrder;
        const lastId = allIds[allIds.length - 1]!;
        gotoList(lastId);

        page.keyboard.press("ArrowDown");

        expect(page.focusedItemId()).toBe(lastId);
    });

    it("ArrowUp at top — 경계에서 멈춤", () => {
        const [a] = addTodos("A", "B", "C");
        gotoList(a);

        page.keyboard.press("ArrowUp");

        expect(page.focusedItemId()).toBe(a);
    });

    it("Home — 첫 번째 항목으로", () => {
        const [a, , c] = addTodos("A", "B", "C");
        gotoList(c);

        page.keyboard.press("Home");

        expect(page.focusedItemId()).toBe(a);
    });

    it("End — 마지막 항목으로", () => {
        const [a] = addTodos("A", "B", "C");
        gotoList(a);

        page.keyboard.press("End");

        const allIds = page.state.data.todoOrder;
        const lastId = allIds[allIds.length - 1]!;
        expect(page.focusedItemId()).toBe(lastId);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 1.2 List Zone — Shift+Arrow 범위 선택
// ═══════════════════════════════════════════════════════════════════

describe("§1.2 List: 키보드 범위 선택", () => {
    it("Shift+ArrowDown — 선택 확장", () => {
        const [a, b] = addTodos("A", "B", "C");
        gotoList(a);

        page.keyboard.press("Shift+ArrowDown");

        expect(page.focusedItemId()).toBe(b);
        expect(page.selection()).toContain(a);
        expect(page.selection()).toContain(b);
    });

    it("Shift+ArrowDown 연속 — 범위 확장", () => {
        const [a, b, c] = addTodos("A", "B", "C");
        gotoList(a);

        page.keyboard.press("Shift+ArrowDown");
        page.keyboard.press("Shift+ArrowDown");

        expect(page.focusedItemId()).toBe(c);
        expect(page.selection()).toContain(a);
        expect(page.selection()).toContain(b);
        expect(page.selection()).toContain(c);
    });

    it("Shift+ArrowUp — 선택 축소", () => {
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
});

// ═══════════════════════════════════════════════════════════════════
// 1.3 List Zone — 키보드 액션
// ═══════════════════════════════════════════════════════════════════

describe("§1.3 List: 키보드 액션", () => {
    it("Space — completed 토글 (onCheck)", () => {
        const [a] = addTodos("Toggle me");
        gotoList(a);

        expect(page.state.data.todos[a!]?.completed).toBe(false);

        page.keyboard.press("Space");

        expect(page.state.data.todos[a!]?.completed).toBe(true);
    });

    it("Enter — 인라인 편집 시작 (onAction → startEdit)", () => {
        const [a] = addTodos("Edit me");
        gotoList(a);

        page.keyboard.press("Enter");

        expect(page.state.ui.editingId).toBe(a);
    });

    it("Backspace — 삭제 다이얼로그 (onDelete)", () => {
        const [a] = addTodos("Delete me");
        gotoList(a);

        page.keyboard.press("Backspace");

        expect(page.state.ui.pendingDeleteIds).toContain(a);
    });

    it("Delete — 삭제 다이얼로그 (onDelete)", () => {
        const [a] = addTodos("Delete me");
        gotoList(a);

        page.keyboard.press("Delete");

        expect(page.state.ui.pendingDeleteIds).toContain(a);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 1.5 List Zone — 마우스 인터랙션
// ═══════════════════════════════════════════════════════════════════

describe("§1.5 List: 마우스 인터랙션", () => {
    it("항목 클릭 → 포커스 + 선택", () => {
        const [a, b] = addTodos("Alpha", "Beta");
        gotoList(a);

        page.click(b!);

        expect(page.focusedItemId()).toBe(b);
        expect(page.attrs(b!)["aria-selected"]).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// ARIA 속성 검증
// ═══════════════════════════════════════════════════════════════════

describe("§ARIA: 리스트 속성", () => {
    it("포커스된 Item: tabIndex=0, data-focused=true", () => {
        const [a, b] = addTodos("Alpha", "Beta");
        gotoList(a);

        expect(page.attrs(a!).tabIndex).toBe(0);
        expect(page.attrs(a!)["data-focused"]).toBe(true);
        expect(page.attrs(b!).tabIndex).toBe(-1);
        expect(page.attrs(b!)["data-focused"]).toBeUndefined();
    });

    it("선택된 Item: aria-selected=true", () => {
        const [a, b] = addTodos("Alpha", "Beta");
        gotoList(a);

        page.click(b!);

        expect(page.attrs(b!)["aria-selected"]).toBe(true);
        expect(page.attrs(a!)["aria-selected"]).toBe(false);
    });
});
