/**
 * resolveTab Unit Tests — OS SPEC §3.3
 *
 * Tests pure tab navigation resolvers:
 * - resolveTabWithinZone: within-zone movement (trap/flow)
 * - resolveTabEscapeZone: cross-zone escape with APG Tab Recovery
 * - resolveTab: top-level orchestrator (trap/flow/escape)
 */

import {
  resolveTab,
  resolveTabEscapeZone,
  resolveTabWithinZone,
  type ZoneOrderEntry,
} from "@os/3-commands/tab/resolveTab";
import { describe, expect, it } from "vitest";

// Helper to create a ZoneOrderEntry with defaults
function zone(
  zoneId: string,
  firstItemId: string | null,
  lastItemId: string | null,
  overrides: Partial<Pick<ZoneOrderEntry, "entry" | "selectedItemId" | "lastFocusedId">> = {},
): ZoneOrderEntry {
  return {
    zoneId,
    firstItemId,
    lastItemId,
    entry: overrides.entry ?? "first",
    selectedItemId: overrides.selectedItemId ?? null,
    lastFocusedId: overrides.lastFocusedId ?? null,
  };
}

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
    zone("z1", "z1_a", "z1_c"),
    zone("z2", "z2_a", "z2_d"),
    zone("z3", "z3_a", "z3_b"),
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
    const singleZone: ZoneOrderEntry[] = [zone("only", "o_a", "o_b")];
    expect(resolveTabEscapeZone("only", singleZone, "forward")).toBeNull();
    expect(resolveTabEscapeZone("only", singleZone, "backward")).toBeNull();
  });

  it("unknown zone: returns null", () => {
    expect(resolveTabEscapeZone("unknown", zones, "forward")).toBeNull();
  });

  // ─── APG Tab Recovery ───────────────────────────────────────────
  describe("APG Tab Recovery — navigate.entry", () => {
    it('entry="selected": Tab goes to selected item', () => {
      const zonesWithSelected: ZoneOrderEntry[] = [
        zone("list", "a", "c"),
        zone("sidebar", "cat-1", "cat-3", {
          entry: "selected",
          selectedItemId: "cat-2",
        }),
      ];
      expect(resolveTabEscapeZone("list", zonesWithSelected, "forward")).toEqual({
        zoneId: "sidebar",
        itemId: "cat-2",
      });
    });

    it('entry="selected": falls back to first when no selection', () => {
      const zonesNoSel: ZoneOrderEntry[] = [
        zone("list", "a", "c"),
        zone("sidebar", "cat-1", "cat-3", { entry: "selected" }),
      ];
      expect(resolveTabEscapeZone("list", zonesNoSel, "forward")).toEqual({
        zoneId: "sidebar",
        itemId: "cat-1",
      });
    });

    it('entry="restore": Tab goes to last focused item', () => {
      const zonesRestore: ZoneOrderEntry[] = [
        zone("z1", "a", "c"),
        zone("toolbar", "t-0", "t-2", {
          entry: "restore",
          lastFocusedId: "t-1",
        }),
      ];
      expect(resolveTabEscapeZone("z1", zonesRestore, "forward")).toEqual({
        zoneId: "toolbar",
        itemId: "t-1",
      });
    });

    it('entry="restore": falls back to first when no lastFocusedId', () => {
      const zonesNoRestore: ZoneOrderEntry[] = [
        zone("z1", "a", "c"),
        zone("toolbar", "t-0", "t-2", { entry: "restore" }),
      ];
      expect(resolveTabEscapeZone("z1", zonesNoRestore, "forward")).toEqual({
        zoneId: "toolbar",
        itemId: "t-0",
      });
    });

    it('entry="first": Tab always goes to first item (default)', () => {
      const zonesFirst: ZoneOrderEntry[] = [
        zone("z1", "a", "c"),
        zone("menu", "m-0", "m-2", { entry: "first" }),
      ];
      expect(resolveTabEscapeZone("z1", zonesFirst, "forward")).toEqual({
        zoneId: "menu",
        itemId: "m-0",
      });
    });

    it('entry="first" backward: Tab goes to last item', () => {
      const zonesFirst: ZoneOrderEntry[] = [
        zone("z1", "a", "c", { entry: "first" }),
        zone("z2", "d", "f"),
      ];
      expect(resolveTabEscapeZone("z2", zonesFirst, "backward")).toEqual({
        zoneId: "z1",
        itemId: "c",
      });
    });
  });

  // ─── Empty zone skip ─────────────────────────────────────────
  describe("Empty zone skip", () => {
    it("skips zone with no items (parent container)", () => {
      const zonesWithEmpty: ZoneOrderEntry[] = [
        zone("parent", null, null), // empty parent (application container)
        zone("sidebar", "s-0", "s-2", { entry: "selected", selectedItemId: "s-1" }),
        zone("list", "l-0", "l-2"),
      ];
      // from list → forward → skip parent → land on sidebar
      expect(resolveTabEscapeZone("list", zonesWithEmpty, "forward")).toEqual({
        zoneId: "sidebar",
        itemId: "s-1", // selected!
      });
    });

    it("skips empty zone backward", () => {
      const zonesWithEmpty: ZoneOrderEntry[] = [
        zone("sidebar", "s-0", "s-2"),
        zone("parent", null, null), // empty
        zone("list", "l-0", "l-2"),
      ];
      // from list → backward → skip parent → land on sidebar
      expect(resolveTabEscapeZone("list", zonesWithEmpty, "backward")).toEqual({
        zoneId: "sidebar",
        itemId: "s-2",
      });
    });

    it("returns null when all other zones are empty", () => {
      const zonesAllEmpty: ZoneOrderEntry[] = [
        zone("active", "a-0", "a-1"),
        zone("empty1", null, null),
        zone("empty2", null, null),
      ];
      expect(resolveTabEscapeZone("active", zonesAllEmpty, "forward")).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveTab (orchestrator)
// ═══════════════════════════════════════════════════════════════════

describe("resolveTab — top-level orchestrator (SPEC §3.3)", () => {
  const items = ["a", "b", "c"];
  const zones: ZoneOrderEntry[] = [
    zone("z1", "a", "c"),
    zone("z2", "d", "f"),
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
