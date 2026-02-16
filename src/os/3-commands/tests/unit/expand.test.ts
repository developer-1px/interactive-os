/**
 * resolveExpansion Unit Tests — OS SPEC §3.7
 *
 * Tests the pure expansion resolver:
 * - toggle: flip expanded state
 * - expand: force expand (idempotent)
 * - collapse: force collapse (idempotent)
 * - no-change returns same reference
 */

import { resolveExpansion } from "@os/3-commands/expand/resolveExpansion";
import { describe, expect, it } from "vitest";

describe("resolveExpansion (SPEC §3.7)", () => {
  describe("toggle", () => {
    it("expands a collapsed item", () => {
      const result = resolveExpansion([], "item1", "toggle");
      expect(result.changed).toBe(true);
      expect(result.expandedItems).toEqual(["item1"]);
    });

    it("collapses an expanded item", () => {
      const result = resolveExpansion(["item1", "item2"], "item1", "toggle");
      expect(result.changed).toBe(true);
      expect(result.expandedItems).toEqual(["item2"]);
    });

    it("preserves other expanded items", () => {
      const result = resolveExpansion(["a", "b", "c"], "b", "toggle");
      expect(result.expandedItems).toEqual(["a", "c"]);
    });
  });

  describe("expand", () => {
    it("expands a collapsed item", () => {
      const result = resolveExpansion([], "item1", "expand");
      expect(result.changed).toBe(true);
      expect(result.expandedItems).toEqual(["item1"]);
    });

    it("is idempotent — no change if already expanded", () => {
      const original = ["item1"];
      const result = resolveExpansion(original, "item1", "expand");
      expect(result.changed).toBe(false);
      expect(result.expandedItems).toBe(original); // same reference
    });
  });

  describe("collapse", () => {
    it("collapses an expanded item", () => {
      const result = resolveExpansion(["item1"], "item1", "collapse");
      expect(result.changed).toBe(true);
      expect(result.expandedItems).toEqual([]);
    });

    it("is idempotent — no change if already collapsed", () => {
      const original: string[] = [];
      const result = resolveExpansion(original, "item1", "collapse");
      expect(result.changed).toBe(false);
      expect(result.expandedItems).toBe(original);
    });
  });
});
