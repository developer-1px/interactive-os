/**
 * T2: Item-layer keybindings — Unit Tests
 *
 * ZIFT Keyboard Resolve: Item layer owns role-specific keys.
 *
 * Feature: zift-keyboard-resolve.feature Scenarios 7-10
 */

import { resolveItemKey } from "@os/keymaps/resolveItemKey";
import { describe, expect, it } from "vitest";

describe("resolveItemKey (Item-layer keybindings)", () => {
  // ═══════════════════════════════════════
  // treeitem role
  // ═══════════════════════════════════════

  describe("treeitem", () => {
    it("ArrowRight (collapsed) → OS_EXPAND", () => {
      const result = resolveItemKey("treeitem", "ArrowRight", {
        expanded: false,
        itemId: "node-1",
      });
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_EXPAND");
    });

    it("ArrowLeft (expanded) → OS_EXPAND (collapse)", () => {
      const result = resolveItemKey("treeitem", "ArrowLeft", {
        expanded: true,
        itemId: "node-1",
      });
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_EXPAND");
    });

    it("ArrowRight (expanded) → null (navigate to first child — Zone handles)", () => {
      const result = resolveItemKey("treeitem", "ArrowRight", {
        expanded: true,
        itemId: "node-1",
      });
      expect(result).toBeNull();
    });

    it("ArrowLeft (collapsed) → null (navigate to parent — Zone handles)", () => {
      const result = resolveItemKey("treeitem", "ArrowLeft", {
        expanded: false,
        itemId: "node-1",
      });
      expect(result).toBeNull();
    });

    it("ArrowDown → null (Zone navigation)", () => {
      const result = resolveItemKey("treeitem", "ArrowDown", {
        expanded: false,
        itemId: "node-1",
      });
      expect(result).toBeNull();
    });

    it("Enter → null (Zone activation)", () => {
      const result = resolveItemKey("treeitem", "Enter", {
        expanded: false,
        itemId: "node-1",
      });
      expect(result).toBeNull();
    });
  });

  // ═══════════════════════════════════════
  // checkbox / switch roles
  // ═══════════════════════════════════════

  describe("checkbox", () => {
    it("Space → OS_CHECK", () => {
      const result = resolveItemKey("checkbox", "Space", { itemId: "cb-1" });
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_CHECK");
    });

    it("Enter → null (Zone activation)", () => {
      const result = resolveItemKey("checkbox", "Enter", { itemId: "cb-1" });
      expect(result).toBeNull();
    });
  });

  describe("switch", () => {
    it("Space → OS_CHECK", () => {
      const result = resolveItemKey("switch", "Space", { itemId: "sw-1" });
      expect(result).not.toBeNull();
      expect(result!.type).toBe("OS_CHECK");
    });
  });

  // ═══════════════════════════════════════
  // Other roles (no item-specific keys)
  // ═══════════════════════════════════════

  describe("option (listbox item)", () => {
    it("ArrowRight → null", () => {
      const result = resolveItemKey("option", "ArrowRight", {
        itemId: "opt-1",
      });
      expect(result).toBeNull();
    });

    it("Space → null (no item override for option — Zone handles)", () => {
      const result = resolveItemKey("option", "Space", { itemId: "opt-1" });
      expect(result).toBeNull();
    });
  });

  describe("null role", () => {
    it("any key → null", () => {
      const result = resolveItemKey(null, "Space", { itemId: "x" });
      expect(result).toBeNull();
    });
  });
});
