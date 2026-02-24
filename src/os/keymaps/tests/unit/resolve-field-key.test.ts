/**
 * T1: Field-layer keybindings — Unit Tests
 *
 * ZIFT Keyboard Resolve: Field layer owns Enter/Escape per fieldType.
 *
 * Feature: zift-keyboard-resolve.feature Scenarios 1-6
 */

import { FieldRegistry } from "@os/6-components/field/FieldRegistry";
import { resolveFieldKey } from "@os/keymaps/resolveFieldKey";
import { beforeEach, describe, expect, it } from "vitest";

describe("resolveFieldKey (Field-layer keybindings)", () => {
  beforeEach(() => {
    // Clear FieldRegistry between tests
    // Unregister all fields
    const fields = FieldRegistry.get().fields;
    for (const id of fields.keys()) {
      FieldRegistry.unregister(id);
    }
  });

  // ═══════════════════════════════════════
  // inline fieldType
  // ═══════════════════════════════════════

  describe("inline field", () => {
    beforeEach(() => {
      FieldRegistry.register("title", { name: "title", fieldType: "inline" });
    });

    it("Enter → OS_FIELD_COMMIT", () => {
      const result = resolveFieldKey("title", "Enter");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_FIELD_COMMIT");
    });

    it("Escape → OS_FIELD_CANCEL", () => {
      const result = resolveFieldKey("title", "Escape");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_FIELD_CANCEL");
    });

    it("ArrowDown → null (delegated to Zone)", () => {
      const result = resolveFieldKey("title", "ArrowDown");
      expect(result).toBeNull();
    });

    it("ArrowUp → null (delegated to Zone)", () => {
      const result = resolveFieldKey("title", "ArrowUp");
      expect(result).toBeNull();
    });

    it("Tab → null (delegated to Zone)", () => {
      const result = resolveFieldKey("title", "Tab");
      expect(result).toBeNull();
    });

    it("letter 'a' → null (browser handles text input)", () => {
      const result = resolveFieldKey("title", "a");
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════
  // block fieldType (multiline)
  // ═══════════════════════════════════════

  describe("block field (multiline)", () => {
    beforeEach(() => {
      FieldRegistry.register("desc", { name: "desc", fieldType: "block" });
    });

    it("Enter → null (newline, field owns)", () => {
      const result = resolveFieldKey("desc", "Enter");
      expect(result).toBeNull();
    });

    it("Escape → OS_FIELD_CANCEL", () => {
      const result = resolveFieldKey("desc", "Escape");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_FIELD_CANCEL");
    });

    it("Tab → null (delegated to Zone)", () => {
      const result = resolveFieldKey("desc", "Tab");
      expect(result).toBeNull();
    });

    it("ArrowDown → null (cursor movement, field owns)", () => {
      // block fields own ArrowDown (cursor movement between lines)
      // but resolveFieldKey returns null because ArrowDown is not a field ACTION
      // it's just "not delegated to Zone" — browser handles it
      const result = resolveFieldKey("desc", "ArrowDown");
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════
  // editor fieldType
  // ═══════════════════════════════════════

  describe("editor field", () => {
    beforeEach(() => {
      FieldRegistry.register("code", { name: "code", fieldType: "editor" });
    });

    it("Enter → null (newline)", () => {
      const result = resolveFieldKey("code", "Enter");
      expect(result).toBeNull();
    });

    it("Escape → OS_FIELD_CANCEL", () => {
      const result = resolveFieldKey("code", "Escape");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_FIELD_CANCEL");
    });

    it("Tab → null (indent, field owns)", () => {
      const result = resolveFieldKey("code", "Tab");
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════
  // Unregistered field (null fieldId)
  // ═══════════════════════════════════════

  describe("unregistered field", () => {
    it("null fieldId + Enter → null", () => {
      const result = resolveFieldKey(null, "Enter");
      expect(result).toBeNull();
    });

    it("null fieldId + Escape → null", () => {
      const result = resolveFieldKey(null, "Escape");
      expect(result).toBeNull();
    });

    it("unknown fieldId + Enter → null", () => {
      const result = resolveFieldKey("nonexistent", "Enter");
      expect(result).toBeNull();
    });
  });
});
