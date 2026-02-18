/**
 * resolveTab Unit Tests — OS SPEC §3.3
 *
 * Tests pure tab navigation resolvers:
 * - resolveTabWithinZone: within-zone movement (trap/flow)
 * - resolveTabEscapeZone: cross-zone escape
 * - resolveTab: top-level orchestrator (trap/flow/escape)
 */

import {
  resolveTab,
  resolveTabEscapeZone,
  resolveTabWithinZone,
  type ZoneOrderEntry,
} from "@os/3-commands/tab/resolveTab";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// resolveTabWithinZone
// ═══════════════════════════════════════════════════════════════════

describe("resolveTabWithinZone (SPEC §3.3)", () => {
  const items = ["a", "b", "c", "d"];

  describe("forward", () => {
    it("moves to next item", () => {
      expect(resolveTabWithinZone("a", items, "forward", false)).toBe("b");
    });

    it("moves from middle to next", () => {
      expect(resolveTabWithinZone("b", items, "forward", false)).toBe("c");
    });

    it("returns null at end (no loop)", () => {
      expect(resolveTabWithinZone("d", items, "forward", false)).toBeNull();
    });

    it("wraps to first at end (loop)", () => {
      expect(resolveTabWithinZone("d", items, "forward", true)).toBe("a");
    });

    it("starts from first when no current item", () => {
      expect(resolveTabWithinZone(null, items, "forward", false)).toBe("a");
    });
  });

  describe("backward", () => {
    it("moves to previous item", () => {
      expect(resolveTabWithinZone("b", items, "backward", false)).toBe("a");
    });

    it("returns null at start (no loop)", () => {
      expect(resolveTabWithinZone("a", items, "backward", false)).toBeNull();
    });

    it("wraps to last at start (loop)", () => {
      expect(resolveTabWithinZone("a", items, "backward", true)).toBe("d");
    });
  });

  it("returns null for empty items", () => {
    expect(resolveTabWithinZone("a", [], "forward", true)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveTabEscapeZone
// ═══════════════════════════════════════════════════════════════════

describe("resolveTabEscapeZone (SPEC §3.3)", () => {
  const zones: ZoneOrderEntry[] = [
    { zoneId: "z1", firstItemId: "z1_a", lastItemId: "z1_c" },
    { zoneId: "z2", firstItemId: "z2_a", lastItemId: "z2_d" },
    { zoneId: "z3", firstItemId: "z3_a", lastItemId: "z3_b" },
  ];

  it("forward: escapes to next zone's first item", () => {
    expect(resolveTabEscapeZone("z1", zones, "forward")).toEqual({
      zoneId: "z2",
      itemId: "z2_a",
    });
  });

  it("backward: escapes to previous zone's last item", () => {
    expect(resolveTabEscapeZone("z2", zones, "backward")).toEqual({
      zoneId: "z1",
      itemId: "z1_c",
    });
  });

  it("forward from last zone: wraps to first zone", () => {
    expect(resolveTabEscapeZone("z3", zones, "forward")).toEqual({
      zoneId: "z1",
      itemId: "z1_a",
    });
  });

  it("backward from first zone: wraps to last zone", () => {
    expect(resolveTabEscapeZone("z1", zones, "backward")).toEqual({
      zoneId: "z3",
      itemId: "z3_b",
    });
  });

  it("single zone: returns null (nowhere to go)", () => {
    const singleZone: ZoneOrderEntry[] = [
      { zoneId: "only", firstItemId: "o_a", lastItemId: "o_b" },
    ];
    expect(resolveTabEscapeZone("only", singleZone, "forward")).toBeNull();
    expect(resolveTabEscapeZone("only", singleZone, "backward")).toBeNull();
  });

  it("unknown zone: returns null", () => {
    expect(resolveTabEscapeZone("unknown", zones, "forward")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveTab (orchestrator)
// ═══════════════════════════════════════════════════════════════════

describe("resolveTab — top-level orchestrator (SPEC §3.3)", () => {
  const items = ["a", "b", "c"];
  const zones: ZoneOrderEntry[] = [
    { zoneId: "z1", firstItemId: "a", lastItemId: "c" },
    { zoneId: "z2", firstItemId: "d", lastItemId: "f" },
  ];

  describe("trap", () => {
    it("wraps forward at end", () => {
      expect(resolveTab("c", items, "trap", "forward", "z1", zones)).toEqual({
        type: "within",
        itemId: "a",
      });
    });

    it("wraps backward at start", () => {
      expect(resolveTab("a", items, "trap", "backward", "z1", zones)).toEqual({
        type: "within",
        itemId: "c",
      });
    });

    it("moves normally in middle", () => {
      expect(resolveTab("a", items, "trap", "forward", "z1", zones)).toEqual({
        type: "within",
        itemId: "b",
      });
    });
  });

  describe("flow", () => {
    it("moves within zone when not at boundary", () => {
      expect(resolveTab("a", items, "flow", "forward", "z1", zones)).toEqual({
        type: "within",
        itemId: "b",
      });
    });

    it("escapes to next zone at boundary (forward)", () => {
      expect(resolveTab("c", items, "flow", "forward", "z1", zones)).toEqual({
        type: "escape",
        zoneId: "z2",
        itemId: "d",
      });
    });

    it("escapes to prev zone at boundary (backward)", () => {
      const z2Items = ["d", "e", "f"];
      expect(resolveTab("d", z2Items, "flow", "backward", "z2", zones)).toEqual(
        {
          type: "escape",
          zoneId: "z1",
          itemId: "c",
        },
      );
    });

    it("single zone at boundary: returns null", () => {
      expect(
        resolveTab("c", items, "flow", "forward", "z1", [zones[0]!]),
      ).toBeNull();
    });
  });

  describe("escape", () => {
    it("immediately escapes to next zone (forward)", () => {
      expect(resolveTab("a", items, "escape", "forward", "z1", zones)).toEqual({
        type: "escape",
        zoneId: "z2",
        itemId: "d",
      });
    });

    it("immediately escapes to prev zone (backward)", () => {
      const z2Items = ["d", "e", "f"];
      expect(
        resolveTab("d", z2Items, "escape", "backward", "z2", zones),
      ).toEqual({
        type: "escape",
        zoneId: "z1",
        itemId: "c",
      });
    });

    it("single zone: returns null (no wrap to self)", () => {
      expect(
        resolveTab("c", items, "escape", "forward", "z1", [zones[0]!]),
      ).toBeNull();
    });

    it("wraps from last zone to first zone (forward)", () => {
      const z2Items = ["d", "e", "f"];
      expect(
        resolveTab("d", z2Items, "escape", "forward", "z2", zones),
      ).toEqual({
        type: "escape",
        zoneId: "z1",
        itemId: "a",
      });
    });
  });

  it("returns null for empty items (trap)", () => {
    expect(resolveTab("a", [], "trap", "forward", "z1", zones)).toBeNull();
  });
});
