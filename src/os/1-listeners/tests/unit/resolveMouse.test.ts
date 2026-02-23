/**
 * resolveMouse — Unit Tests
 *
 * Tests the pure mouse event resolution logic.
 * No DOM, no JSDOM — just input → output.
 */

import {
  isClickExpandable,
  type MouseInput,
  resolveMouse,
  resolveSelectMode,
} from "@os/1-listeners/mouse/resolveMouse";
import { describe, expect, test } from "vitest";

// ─── Helpers ───

function baseInput(overrides: Partial<MouseInput> = {}): MouseInput {
  return {
    targetItemId: "item-1",
    targetGroupId: "zone-1",
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
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
    expect(
      resolveSelectMode({
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
      }),
    ).toBe("replace");
  });

  test("shift → range", () => {
    expect(
      resolveSelectMode({
        shiftKey: true,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
      }),
    ).toBe("range");
  });

  test("meta → toggle", () => {
    expect(
      resolveSelectMode({
        shiftKey: false,
        metaKey: true,
        ctrlKey: false,
        altKey: false,
      }),
    ).toBe("toggle");
  });

  test("ctrl → toggle", () => {
    expect(
      resolveSelectMode({
        shiftKey: false,
        metaKey: false,
        ctrlKey: true,
        altKey: false,
      }),
    ).toBe("toggle");
  });

  test("shift takes priority over meta", () => {
    expect(
      resolveSelectMode({
        shiftKey: true,
        metaKey: true,
        ctrlKey: false,
        altKey: false,
      }),
    ).toBe("range");
  });
  test("alt → replace (default unless specified)", () => {
    expect(
      resolveSelectMode({
        shiftKey: false,
        metaKey: false,
        ctrlKey: false,
        altKey: true,
      }),
    ).toBe("replace");
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

  test("aria-expanded + treeitem → false (click event handles expand, not mousedown)", () => {
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
    expect(result.commands).toHaveLength(2);
    expect(result.commands[0]!.type).toBe("OS_FOCUS");
    expect(result.commands[1]!.type).toBe("OS_SELECT");
    expect((result.commands[1]!.payload as any).mode).toBe("replace");
    expect(result.preventDefault).toBe(false);
  });

  test("shift+click → range select", () => {
    const result = resolveMouse(baseInput({ shiftKey: true }));
    const selectCmd = result.commands.find((c) => c.type === "OS_SELECT");
    expect(selectCmd).toBeDefined();
    expect((selectCmd!.payload as any).mode).toBe("range");
    expect(result.preventDefault).toBe(true);
  });

  test("meta+click → toggle select", () => {
    const result = resolveMouse(baseInput({ metaKey: true }));
    const selectCmd = result.commands.find((c) => c.type === "OS_SELECT");
    expect(selectCmd).toBeDefined();
    expect((selectCmd!.payload as any).mode).toBe("toggle");
    expect(result.preventDefault).toBe(true);
  });

  test("expandable button → shouldExpand true", () => {
    const result = resolveMouse(
      baseInput({ hasAriaExpanded: true, itemRole: "button" }),
    );
    expect(result.commands).toHaveLength(3);
    const activateCmd = result.commands.find((c) => c.type === "OS_ACTIVATE");
    expect(activateCmd).toBeDefined();
  });

  test("treeitem with aria-expanded → NO OS_ACTIVATE (mousedown skips, click handles it)", () => {
    const result = resolveMouse(
      baseInput({ hasAriaExpanded: true, itemRole: "treeitem" }),
    );
    expect(result.commands.some((c) => c.type === "OS_ACTIVATE")).toBe(false);
  });

  test("menuitem with aria-expanded → NO OS_ACTIVATE (hover-only expand)", () => {
    const result = resolveMouse(
      baseInput({ hasAriaExpanded: true, itemRole: "menuitem" }),
    );
    expect(result.commands.some((c) => c.type === "OS_ACTIVATE")).toBe(false);
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
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_FOCUS");
    expect((result.commands[0]!.payload as any).itemId).toBe("field-1");
    expect(result.preventDefault).toBe(true);
  });

  test("no target item, no zone → ignore", () => {
    const result = resolveMouse(
      baseInput({ targetItemId: null, targetGroupId: null }),
    );
    expect(result.commands).toHaveLength(0);
    expect(result.preventDefault).toBe(false);
  });

  test("no target item, but zone exists → zone-activate", () => {
    const result = resolveMouse(
      baseInput({ targetItemId: null, targetGroupId: "zone-1" }),
    );
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]!.type).toBe("OS_FOCUS");
    expect((result.commands[0]!.payload as any).itemId).toBe(null);
  });
});
