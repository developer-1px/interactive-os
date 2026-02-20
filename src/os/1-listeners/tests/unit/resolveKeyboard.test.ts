/**
 * resolveKeyboard — Unit Tests
 *
 * Tests the pure keyboard event resolution logic.
 * No DOM, no JSDOM, no kernel — just input → output.
 */

import {
  type KeyboardInput,
  resolveKeyboard,
} from "@os/1-listeners/keyboard/resolveKeyboard";
import { describe, expect, test } from "vitest";

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
    cursor: null,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Guard: ignored inputs
// ═══════════════════════════════════════════════════════════════════

describe("resolveKeyboard — guards", () => {
  test("isComposing → ignore", () => {
    const result = resolveKeyboard(baseInput({ isComposing: true }));
    expect(result.commands).toHaveLength(0);
  });

  test("isDefaultPrevented → ignore", () => {
    const result = resolveKeyboard(baseInput({ isDefaultPrevented: true }));
    expect(result.commands).toHaveLength(0);
  });

  test("isInspector → ignore", () => {
    const result = resolveKeyboard(baseInput({ isInspector: true }));
    expect(result.commands).toHaveLength(0);
  });

  test("isCombobox → ignore", () => {
    const result = resolveKeyboard(baseInput({ isCombobox: true }));
    expect(result.commands).toHaveLength(0);
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
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_CHECK");
    expect((result.commands[0]!.payload as any).targetId).toBe("item-1");
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
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_CHECK");
    expect((result.commands[0]!.payload as any).targetId).toBe("toggle-1");
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
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_CHECK");
    expect((result.commands[0]!.payload as any).targetId).toBe("zone-item-1");
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
    expect(result.commands.some((c) => c.type === "OS_CHECK")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Keybinding dispatch
// ═══════════════════════════════════════════════════════════════════

describe("resolveKeyboard — keybinding dispatch", () => {
  test("ArrowDown → dispatch (OS default keybinding)", () => {
    const result = resolveKeyboard(baseInput({ canonicalKey: "ArrowDown" }));
    expect(result.commands.length).toBeGreaterThan(0);
    expect(result.meta!["type"]).toBe("KEYBOARD");
  });

  test("ArrowUp → dispatch", () => {
    const result = resolveKeyboard(baseInput({ canonicalKey: "ArrowUp" }));
    expect(result.commands.length).toBeGreaterThan(0);
  });

  test("Tab → dispatch", () => {
    const result = resolveKeyboard(baseInput({ canonicalKey: "Tab" }));
    expect(result.commands.length).toBeGreaterThan(0);
  });

  test("Escape → dispatch", () => {
    const result = resolveKeyboard(baseInput({ canonicalKey: "Escape" }));
    expect(result.commands.length).toBeGreaterThan(0);
  });

  test("unknown key without binding → fallback", () => {
    const result = resolveKeyboard(
      baseInput({ canonicalKey: "F13", key: "F13" }),
    );
    expect(result.commands).toHaveLength(0);
    expect(result.fallback).toBe(true);
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
    expect(result.meta).toEqual({
      type: "KEYBOARD",
      key: "ArrowDown",
      code: "ArrowDown",
      elementId: "my-element",
    });
  });
});
