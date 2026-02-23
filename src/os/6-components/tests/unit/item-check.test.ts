/**
 * OS_CHECK — Pipeline Test
 *
 * Item.CheckTrigger 컴포넌트는 직접 os.dispatch(OS_CHECK(...))를 호출한다.
 * 이 파일은 OS_CHECK가 올바르게 동작하는지 검증한다:
 * - Space 키로 현재 포커스된 아이템을 check
 * - checkbox role 아이템에서 onCheck 콜백 호출
 * - Enter는 onAction, check 아님
 *
 * Feature: item-check.feature
 */

import { describe, expect, it, vi } from "vitest";
import { createOsPage } from "@os/createOsPage";

const LIST_ITEMS = ["todo-1", "todo-2", "todo-3"];

function listFactory(focusedItem = "todo-1") {
    const onCheck = vi.fn();
    const onAction = vi.fn();
    const page = createOsPage();
    page.setItems(LIST_ITEMS);
    page.setRole("todo-list", "list", { onCheck, onAction });
    page.setConfig({
        navigate: { orientation: "vertical", loop: false, seamless: false, typeahead: false, entry: "first", recovery: "next", arrowExpand: false },
        select: { mode: "single", followFocus: false, disallowEmpty: false, range: false, toggle: false },
    });
    page.setActiveZone("todo-list", focusedItem);
    return { page, onCheck, onAction };
}

describe("OS_CHECK: Keyboard pipeline (Space)", () => {
    it("Space dispatches onCheck with focused itemId", () => {
        const { page, onCheck } = listFactory("todo-1");

        page.keyboard.press("Space");

        expect(onCheck).toHaveBeenCalled();
        const cursor = onCheck.mock.calls[0][0];
        expect(cursor.focusId).toBe("todo-1");
    });

    it("Space on different focused item checks that item", () => {
        const { page, onCheck } = listFactory("todo-2");

        page.keyboard.press("Space");

        expect(onCheck).toHaveBeenCalled();
        expect(onCheck.mock.calls[0][0].focusId).toBe("todo-2");
    });

    it("Space does NOT dispatch onAction", () => {
        const { page, onAction } = listFactory("todo-1");

        page.keyboard.press("Space");

        expect(onAction).not.toHaveBeenCalled();
    });

    it("Enter triggers onAction, not onCheck", () => {
        const { page, onAction, onCheck } = listFactory("todo-1");

        page.keyboard.press("Enter");

        expect(onAction).toHaveBeenCalled();
        expect(onCheck).not.toHaveBeenCalled();
    });

    it("ArrowDown then Space checks the correct item", () => {
        const { page, onCheck } = listFactory("todo-1");

        page.keyboard.press("ArrowDown"); // → todo-2
        page.keyboard.press("Space");

        expect(onCheck.mock.calls[0][0].focusId).toBe("todo-2");
    });
});
