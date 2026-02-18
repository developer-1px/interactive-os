/**
 * resolveKeyboard — Unit Tests
 *
 * Tests the pure keyboard event resolution logic.
 * No DOM, no JSDOM, no kernel — just input → output.
 */

import { describe, expect, test, beforeEach } from "vitest";
import {
    resolveKeyboard,
    type KeyboardInput,
} from "@os/1-listeners/keyboard/resolveKeyboard";
import { Keybindings } from "@os/keymaps/keybindings";

// Ensure OS defaults are registered for Keybindings.resolve
import "@os/keymaps/osDefaults";

// ─── Helpers ───

function baseInput(overrides: Partial<KeyboardInput> = {}): KeyboardInput {
    return {
        canonicalKey: "ArrowDown",
        key: "ArrowDown",
        isEditing: false,
        isFieldActive: false,
        isComposing: false,
        isDefaultPrevented: false,
        isInspector: false,
        isCombobox: false,
        focusedItemRole: null,
        focusedItemId: null,
        activeZoneHasCheck: false,
        activeZoneFocusedItemId: null,
        elementId: undefined,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Guard: ignored inputs
// ═══════════════════════════════════════════════════════════════════

describe("resolveKeyboard — guards", () => {
    test("isComposing → ignore", () => {
        const result = resolveKeyboard(baseInput({ isComposing: true }));
        expect(result.action).toBe("ignore");
    });

    test("isDefaultPrevented → ignore", () => {
        const result = resolveKeyboard(baseInput({ isDefaultPrevented: true }));
        expect(result.action).toBe("ignore");
    });

    test("isInspector → ignore", () => {
        const result = resolveKeyboard(baseInput({ isInspector: true }));
        expect(result.action).toBe("ignore");
    });

    test("isCombobox → ignore", () => {
        const result = resolveKeyboard(baseInput({ isCombobox: true }));
        expect(result.action).toBe("ignore");
    });
});

// ═══════════════════════════════════════════════════════════════════
// CHECK resolution (Space on checkbox/switch)
// ═══════════════════════════════════════════════════════════════════

describe("resolveKeyboard — Space CHECK", () => {
    test("Space + checkbox role → check", () => {
        const result = resolveKeyboard(
            baseInput({
                canonicalKey: "Space",
                key: " ",
                focusedItemRole: "checkbox",
                focusedItemId: "item-1",
            }),
        );
        expect(result.action).toBe("check");
        if (result.action === "check") {
            expect(result.targetId).toBe("item-1");
        }
    });

    test("Space + switch role → check", () => {
        const result = resolveKeyboard(
            baseInput({
                canonicalKey: "Space",
                key: " ",
                focusedItemRole: "switch",
                focusedItemId: "toggle-1",
            }),
        );
        expect(result.action).toBe("check");
        if (result.action === "check") {
            expect(result.targetId).toBe("toggle-1");
        }
    });

    test("Space + zone has onCheck → check via zone", () => {
        const result = resolveKeyboard(
            baseInput({
                canonicalKey: "Space",
                key: " ",
                focusedItemRole: null,
                focusedItemId: null,
                activeZoneHasCheck: true,
                activeZoneFocusedItemId: "zone-item-1",
            }),
        );
        expect(result.action).toBe("check");
        if (result.action === "check") {
            expect(result.targetId).toBe("zone-item-1");
        }
    });

    test("Space while editing → not check (normal keybinding)", () => {
        const result = resolveKeyboard(
            baseInput({
                canonicalKey: "Space",
                key: " ",
                isEditing: true,
                focusedItemRole: "checkbox",
                focusedItemId: "item-1",
            }),
        );
        // Editing means Space is text input, not CHECK
        expect(result.action).not.toBe("check");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Keybinding dispatch
// ═══════════════════════════════════════════════════════════════════

describe("resolveKeyboard — keybinding dispatch", () => {
    test("ArrowDown → dispatch (OS default keybinding)", () => {
        const result = resolveKeyboard(baseInput({ canonicalKey: "ArrowDown" }));
        expect(result.action).toBe("dispatch");
        if (result.action === "dispatch") {
            expect(result.command).toBeDefined();
            expect(result.meta.type).toBe("KEYBOARD");
        }
    });

    test("ArrowUp → dispatch", () => {
        const result = resolveKeyboard(baseInput({ canonicalKey: "ArrowUp" }));
        expect(result.action).toBe("dispatch");
    });

    test("Tab → dispatch", () => {
        const result = resolveKeyboard(baseInput({ canonicalKey: "Tab" }));
        expect(result.action).toBe("dispatch");
    });

    test("Escape → dispatch", () => {
        const result = resolveKeyboard(baseInput({ canonicalKey: "Escape" }));
        expect(result.action).toBe("dispatch");
    });

    test("unknown key without binding → fallback", () => {
        const result = resolveKeyboard(
            baseInput({ canonicalKey: "F13", key: "F13" }),
        );
        expect(result.action).toBe("fallback");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Meta construction
// ═══════════════════════════════════════════════════════════════════

describe("resolveKeyboard — meta", () => {
    test("meta includes canonicalKey and elementId", () => {
        const result = resolveKeyboard(
            baseInput({
                canonicalKey: "ArrowDown",
                key: "ArrowDown",
                elementId: "my-element",
            }),
        );
        if (result.action === "dispatch") {
            expect(result.meta).toEqual({
                type: "KEYBOARD",
                key: "ArrowDown",
                code: "ArrowDown",
                elementId: "my-element",
            });
        }
    });
});
