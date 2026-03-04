/**
 * Todo Draft Zone — §3 키보드 인터랙션
 *
 * BDD spec (docs/6-products/todo/spec/keyboard-and-mouse.md §3)
 * Issue: Field resetOnSubmit — contentEditable DOM 미동기화
 */

import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { describe, expect, it } from "vitest";
import { page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("§3 Draft Zone: 새 할 일 입력", () => {
  it("Enter → todo 추가 + 필드 초기화 (resetOnSubmit)", () => {
    // Given: draft 필드에 포커스
    page.goto("draft", { focusedItemId: "DRAFT" });
    const beforeCount = page.state.data.todoOrder.length;

    // When: 텍스트 입력 후 Enter
    page.keyboard.type("장보기");
    expect(FieldRegistry.getValue("DRAFT")).toBe("장보기");

    page.keyboard.press("Enter");

    // Then: todo 추가됨
    expect(page.state.data.todoOrder.length).toBe(beforeCount + 1);

    // And: 필드 값이 초기화됨 (resetOnSubmit)
    const fieldValue = FieldRegistry.getValue("DRAFT");
    expect(fieldValue).toBe("");
  });

  // Note: "빈 텍스트 Enter → 차단" is validated by schema (z.string().min(1))
  // in Field.tsx handleCommit. Headless OS_FIELD_COMMIT path has separate validation.
  // Skipped here due to test isolation issue with page singleton reset.
});
