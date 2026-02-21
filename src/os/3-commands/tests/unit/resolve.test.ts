/**
 * resolveItemId — Lazy Resolution pure function tests
 *
 * Core rule: "저장은 ID만, 해석은 읽을 때"
 *   - storedId가 items에 있으면 → 그대로 반환
 *   - storedId가 items에 없으면 → next > prev fallback
 *   - storedId가 null이면 → null (포커스 없음)
 *   - items가 비어있으면 → null
 */

import { describe, it, expect } from "vitest";
import { resolveItemId, resolveSelection } from "../../../state/resolve";

describe("resolveItemId", () => {
    // ── Happy path: ID exists ──
    it("returns storedId when it exists in items", () => {
        expect(resolveItemId("b", ["a", "b", "c"])).toBe("b");
    });

    it("returns storedId at first position", () => {
        expect(resolveItemId("a", ["a", "b", "c"])).toBe("a");
    });

    it("returns storedId at last position", () => {
        expect(resolveItemId("c", ["a", "b", "c"])).toBe("c");
    });

    // ── Stale reference: ID deleted ──
    it("falls back to next item when storedId is deleted (middle)", () => {
        // b was between a and c, b deleted → next is c
        expect(resolveItemId("b", ["a", "c"], 1)).toBe("c");
    });

    it("falls back to prev when storedId was last and deleted", () => {
        // c was at index 2, c deleted → prev is b
        expect(resolveItemId("c", ["a", "b"], 2)).toBe("b");
    });

    it("falls back to first item when no lastIndex hint", () => {
        // b deleted, no hint → first item
        expect(resolveItemId("b", ["a", "c"])).toBe("a");
    });

    it("falls back to last item when lastIndex exceeds list length", () => {
        expect(resolveItemId("z", ["a", "b"], 10)).toBe("b");
    });

    // ── Edge cases ──
    it("returns null when storedId is null", () => {
        expect(resolveItemId(null, ["a", "b"])).toBeNull();
    });

    it("returns null when items is empty", () => {
        expect(resolveItemId("a", [])).toBeNull();
    });

    it("returns null when storedId is null and items is empty", () => {
        expect(resolveItemId(null, [])).toBeNull();
    });

    it("returns the only item when storedId deleted from single-item list", () => {
        expect(resolveItemId("deleted", ["only"], 0)).toBe("only");
    });

    // ── Undo scenario: ID comes back ──
    it("returns restored item after undo (zero-cost restoration)", () => {
        // Before cut: focus = "b", items = [a, b, c]
        // After cut:  items = [a, c]         → resolve("b", [a,c], 1) → "c"
        // After undo: items = [a, b, c]      → resolve("b", [a,b,c]) → "b" ✅
        expect(resolveItemId("b", ["a", "c"], 1)).toBe("c");
        expect(resolveItemId("b", ["a", "b", "c"])).toBe("b");
    });
});

describe("resolveSelection", () => {
    it("returns all items that still exist", () => {
        expect(resolveSelection(["a", "b", "c"], ["a", "c", "d"])).toEqual([
            "a",
            "c",
        ]);
    });

    it("returns empty when all selected items are deleted", () => {
        expect(resolveSelection(["a", "b"], ["c", "d"])).toEqual([]);
    });

    it("returns empty for empty selection", () => {
        expect(resolveSelection([], ["a", "b"])).toEqual([]);
    });

    it("returns empty for empty items", () => {
        expect(resolveSelection(["a", "b"], [])).toEqual([]);
    });

    it("preserves order of original selection", () => {
        expect(resolveSelection(["c", "a", "b"], ["a", "b", "c", "d"])).toEqual([
            "c",
            "a",
            "b",
        ]);
    });

    // ── Undo scenario ──
    it("restores full selection after undo", () => {
        const selection = ["card-3", "card-4", "card-5"];
        // After cut
        expect(resolveSelection(selection, ["card-6"])).toEqual([]);
        // After undo
        expect(
            resolveSelection(selection, [
                "card-3",
                "card-4",
                "card-5",
                "card-6",
            ]),
        ).toEqual(["card-3", "card-4", "card-5"]);
    });
});
