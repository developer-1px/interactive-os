/**
 * resolveMouse — Unit Tests
 *
 * Tests the pure mouse event resolution logic.
 * No DOM, no JSDOM — just input → output.
 */

import { describe, expect, test } from "vitest";
import {
    resolveMouse,
    resolveSelectMode,
    isClickExpandable,
    type MouseInput,
} from "@os/1-listeners/mouse/resolveMouse";

// ─── Helpers ───

function baseInput(overrides: Partial<MouseInput> = {}): MouseInput {
    return {
        targetItemId: "item-1",
        targetGroupId: "zone-1",
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        isLabel: false,
        labelTargetItemId: null,
        labelTargetGroupId: null,
        hasAriaExpanded: false,
        itemRole: null,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
// resolveSelectMode
// ═══════════════════════════════════════════════════════════════════

describe("resolveSelectMode", () => {
    test("no modifiers → replace", () => {
        expect(resolveSelectMode({ shiftKey: false, metaKey: false, ctrlKey: false })).toBe("replace");
    });

    test("shift → range", () => {
        expect(resolveSelectMode({ shiftKey: true, metaKey: false, ctrlKey: false })).toBe("range");
    });

    test("meta → toggle", () => {
        expect(resolveSelectMode({ shiftKey: false, metaKey: true, ctrlKey: false })).toBe("toggle");
    });

    test("ctrl → toggle", () => {
        expect(resolveSelectMode({ shiftKey: false, metaKey: false, ctrlKey: true })).toBe("toggle");
    });

    test("shift takes priority over meta", () => {
        expect(resolveSelectMode({ shiftKey: true, metaKey: true, ctrlKey: false })).toBe("range");
    });
});

// ═══════════════════════════════════════════════════════════════════
// isClickExpandable
// ═══════════════════════════════════════════════════════════════════

describe("isClickExpandable", () => {
    test("no aria-expanded → false", () => {
        expect(isClickExpandable(false, null)).toBe(false);
    });

    test("aria-expanded + no role → true (default clickable)", () => {
        expect(isClickExpandable(true, null)).toBe(true);
    });

    test("aria-expanded + button role → true", () => {
        expect(isClickExpandable(true, "button")).toBe(true);
    });

    test("aria-expanded + treeitem → false (keyboard-only)", () => {
        expect(isClickExpandable(true, "treeitem")).toBe(false);
    });

    test("aria-expanded + menuitem → false (keyboard-only)", () => {
        expect(isClickExpandable(true, "menuitem")).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// resolveMouse — full resolution
// ═══════════════════════════════════════════════════════════════════

describe("resolveMouse", () => {
    test("normal click → focus-and-select with replace", () => {
        const result = resolveMouse(baseInput());
        expect(result).toEqual({
            action: "focus-and-select",
            itemId: "item-1",
            groupId: "zone-1",
            selectMode: "replace",
            shouldExpand: false,
        });
    });

    test("shift+click → range select", () => {
        const result = resolveMouse(baseInput({ shiftKey: true }));
        if (result.action === "focus-and-select") {
            expect(result.selectMode).toBe("range");
        }
    });

    test("meta+click → toggle select", () => {
        const result = resolveMouse(baseInput({ metaKey: true }));
        if (result.action === "focus-and-select") {
            expect(result.selectMode).toBe("toggle");
        }
    });

    test("expandable button → shouldExpand true", () => {
        const result = resolveMouse(
            baseInput({ hasAriaExpanded: true, itemRole: "button" }),
        );
        if (result.action === "focus-and-select") {
            expect(result.shouldExpand).toBe(true);
        }
    });

    test("treeitem with aria-expanded → shouldExpand false", () => {
        const result = resolveMouse(
            baseInput({ hasAriaExpanded: true, itemRole: "treeitem" }),
        );
        if (result.action === "focus-and-select") {
            expect(result.shouldExpand).toBe(false);
        }
    });

    test("label click → label-redirect", () => {
        const result = resolveMouse(
            baseInput({
                targetItemId: null,
                targetGroupId: null,
                isLabel: true,
                labelTargetItemId: "field-1",
                labelTargetGroupId: "zone-1",
            }),
        );
        expect(result).toEqual({
            action: "label-redirect",
            itemId: "field-1",
            groupId: "zone-1",
        });
    });

    test("no target item, no zone → ignore", () => {
        const result = resolveMouse(
            baseInput({ targetItemId: null, targetGroupId: null }),
        );
        expect(result.action).toBe("ignore");
    });

    test("no target item, but zone exists → zone-activate", () => {
        const result = resolveMouse(
            baseInput({ targetItemId: null, targetGroupId: "zone-1" }),
        );
        expect(result).toEqual({
            action: "zone-activate",
            groupId: "zone-1",
        });
    });
});
