/**
 * Todo User Journey — full pipeline headless tests
 *
 * Unlike todo-bdd.test.ts which uses addTodos() (dispatch shortcut),
 * these tests create todos through the actual user input path:
 *   draft zone → keyboard.type() → keyboard.press("Enter")
 *
 * This verifies the complete input→command→state→view pipeline.
 */

import { describe, expect, it } from "vitest";
import { FieldRegistry } from "@/os/6-components/field/FieldRegistry";
import { gotoList, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

// ═══════════════════════════════════════════════════════════════════
// Helper: create a todo through the draft field (full user pipeline)
// ═══════════════════════════════════════════════════════════════════

function createTodoViaDraft(text: string): void {
  page.goto("draft");
  page.keyboard.type(text);
  page.keyboard.press("Enter");
}

// ═══════════════════════════════════════════════════════════════════
// §J1: Create — draft field → todo 생성
// ═══════════════════════════════════════════════════════════════════

describe("§J1: Create via draft field", () => {
  it("한 개 생성 → 리스트에 추가됨", () => {
    const before = page.state.data.todoOrder.length;

    createTodoViaDraft("Buy milk");

    expect(page.state.data.todoOrder.length).toBe(before + 1);
    const lastId = page.state.data.todoOrder.at(-1)!;
    expect(page.state.data.todos[lastId]?.text).toBe("Buy milk");
  });

  it("연속 생성 → 순서대로 추가됨", () => {
    const before = page.state.data.todoOrder.length;

    createTodoViaDraft("First");
    createTodoViaDraft("Second");
    createTodoViaDraft("Third");

    expect(page.state.data.todoOrder.length).toBe(before + 3);

    const order = page.state.data.todoOrder;
    const texts = order.slice(-3).map((id) => page.state.data.todos[id]?.text);
    expect(texts).toEqual(["First", "Second", "Third"]);
  });

  it("생성 후 필드가 비워짐", () => {
    createTodoViaDraft("Reset test");

    expect(FieldRegistry.getValue("DRAFT")).toBe("");
  });

  it("빈 입력 → 생성 안 됨", () => {
    const before = page.state.data.todoOrder.length;

    page.goto("draft");
    page.keyboard.press("Enter");

    expect(page.state.data.todoOrder.length).toBe(before);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §J2: Create → Navigate → Check (생성 후 체크)
// ═══════════════════════════════════════════════════════════════════

describe("§J2: Create → Check", () => {
  it("draft로 생성 → list로 이동 → Space로 체크", () => {
    createTodoViaDraft("Checkable item");

    const newId = page.state.data.todoOrder.at(-1)!;
    expect(page.state.data.todos[newId]?.completed).toBe(false);

    // Navigate to list, focus on the new todo
    gotoList(newId);
    page.keyboard.press("Space");

    expect(page.state.data.todos[newId]?.completed).toBe(true);
  });

  it("두 개 생성 → 하나만 체크 → 다른 것은 그대로", () => {
    createTodoViaDraft("Check me");
    createTodoViaDraft("Leave me");

    const order = page.state.data.todoOrder;
    const checkId = order.at(-2)!;
    const leaveId = order.at(-1)!;

    gotoList(checkId);
    page.keyboard.press("Space");

    expect(page.state.data.todos[checkId]?.completed).toBe(true);
    expect(page.state.data.todos[leaveId]?.completed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §J3: Create → Delete (생성 후 삭제)
// ═══════════════════════════════════════════════════════════════════

describe("§J3: Create → Delete", () => {
  it("draft로 생성 → list로 이동 → Backspace로 삭제 요청", () => {
    createTodoViaDraft("Doomed item");

    const newId = page.state.data.todoOrder.at(-1)!;

    gotoList(newId);
    page.keyboard.press("Backspace");

    expect(page.state.ui.pendingDeleteIds).toContain(newId);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §J4: Create → Reorder (생성 후 순서 변경)
// ═══════════════════════════════════════════════════════════════════

describe("§J4: Create → Reorder", () => {
  it("두 개 생성 → 마지막 항목 Cmd+ArrowUp → 순서 뒤바뀜", () => {
    createTodoViaDraft("Alpha");
    createTodoViaDraft("Beta");

    const order = page.state.data.todoOrder;
    const alphaId = order.at(-2)!;
    const betaId = order.at(-1)!;

    // Focus on Beta (last item) and move it up
    gotoList(betaId);
    page.keyboard.press("Meta+ArrowUp");

    const newOrder = page.state.data.todoOrder;
    expect(newOrder.indexOf(betaId)).toBeLessThan(newOrder.indexOf(alphaId));
  });
});

// ═══════════════════════════════════════════════════════════════════
// §J5: Create → Copy → Paste (생성 후 복제)
// ═══════════════════════════════════════════════════════════════════

describe("§J5: Create → Copy → Paste", () => {
  it("draft로 생성 → 복사 → 붙여넣기 → 동일 텍스트 복제됨", () => {
    createTodoViaDraft("Clone me");

    const newId = page.state.data.todoOrder.at(-1)!;
    const beforeCount = page.state.data.todoOrder.length;

    gotoList(newId);
    page.keyboard.press("Meta+c");
    page.keyboard.press("Meta+v");

    expect(page.state.data.todoOrder.length).toBe(beforeCount + 1);

    // The cloned item should have the same text
    const clonedId = page.state.data.todoOrder.at(-1)!;
    expect(page.state.data.todos[clonedId]?.text).toBe("Clone me");
  });
});
