/**
 * Navigation Unit Tests — OS SPEC §3.2
 *
 * Tests the pure navigation resolver against the SPEC's Navigate Config Matrix.
 * No DOM, no kernel dispatch — pure function testing.
 *
 * Covers:
 * - resolveNavigate: orientation filtering, loop/clamp, direction resolution
 * - resolveEntry: zone entry strategies (first, last, restore, selected)
 * - resolveLinear: home/end, forward/backward, loop wrapping
 */

import { resolveEntry } from "@os/3-commands/navigate/entry";
import { resolveNavigate } from "@os/3-commands/navigate/resolve";
import type { NavigateConfig } from "@os/schemas/focus/config/FocusNavigateConfig";
import { DEFAULT_NAVIGATE } from "@os/schemas/focus/config/FocusNavigateConfig";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const ITEMS = ["a", "b", "c", "d", "e"];

function cfg(overrides: Partial<NavigateConfig> = {}): NavigateConfig {
  return { ...DEFAULT_NAVIGATE, ...overrides };
}

const NO_SPATIAL = { stickyX: null, stickyY: null };

// ═══════════════════════════════════════════════════════════════════
// §3.2 resolveEntry — Zone Entry Strategy
// ═══════════════════════════════════════════════════════════════════

describe("resolveEntry — Zone Entry Strategy (SPEC §3.2)", () => {
  it('entry: "first" → returns first item', () => {
    expect(resolveEntry(ITEMS, cfg({ entry: "first" }))).toBe("a");
  });

  it('entry: "last" → returns last item', () => {
    expect(resolveEntry(ITEMS, cfg({ entry: "last" }))).toBe("e");
  });

  it('entry: "restore" → returns lastFocusedId if available', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "restore" }), {
        lastFocusedId: "c",
      }),
    ).toBe("c");
  });

  it('entry: "restore" → falls back to selection if no lastFocused', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "restore" }), {
        lastFocusedId: null,
        selection: ["d"],
      }),
    ).toBe("d");
  });

  it('entry: "restore" → falls back to first if nothing available', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "restore" }), {
        lastFocusedId: null,
        selection: [],
      }),
    ).toBe("a");
  });

  it('entry: "restore" → falls back to first if lastFocused not in items', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "restore" }), {
        lastFocusedId: "z",
      }),
    ).toBe("a");
  });

  it('entry: "selected" → returns selected item', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "selected" }), {
        selection: ["c"],
      }),
    ).toBe("c");
  });

  it('entry: "selected" → falls back to lastFocusedId if no selection', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "selected" }), {
        selection: [],
        lastFocusedId: "b",
      }),
    ).toBe("b");
  });

  it('entry: "selected" → falls back to first if nothing', () => {
    expect(
      resolveEntry(ITEMS, cfg({ entry: "selected" }), {
        selection: [],
        lastFocusedId: null,
      }),
    ).toBe("a");
  });

  it("empty items → returns null", () => {
    expect(resolveEntry([], cfg())).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3.2 Orientation Filtering
// ═══════════════════════════════════════════════════════════════════

describe("Navigate: Orientation Filtering (SPEC §3.2)", () => {
  describe("vertical orientation", () => {
    const config = cfg({ orientation: "vertical" });

    it("down → moves to next item", () => {
      const result = resolveNavigate("b", "down", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("c");
    });

    it("up → moves to previous item", () => {
      const result = resolveNavigate("b", "up", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("a");
    });

    it("left → ignored (stays on current)", () => {
      const result = resolveNavigate("b", "left", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("b");
    });

    it("right → ignored (stays on current)", () => {
      const result = resolveNavigate("b", "right", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("b");
    });
  });

  describe("horizontal orientation", () => {
    const config = cfg({ orientation: "horizontal" });

    it("right → moves to next item", () => {
      const result = resolveNavigate("b", "right", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("c");
    });

    it("left → moves to previous item", () => {
      const result = resolveNavigate("b", "left", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("a");
    });

    it("down → ignored (stays on current)", () => {
      const result = resolveNavigate("b", "down", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("b");
    });

    it("up → ignored (stays on current)", () => {
      const result = resolveNavigate("b", "up", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("b");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3.2 Loop / Clamp
// ═══════════════════════════════════════════════════════════════════

describe("Navigate: Loop vs Clamp (SPEC §3.2)", () => {
  describe("loop: true", () => {
    const config = cfg({ orientation: "vertical", loop: true });

    it("down at end → wraps to first", () => {
      const result = resolveNavigate("e", "down", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("a");
    });

    it("up at start → wraps to last", () => {
      const result = resolveNavigate("a", "up", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("e");
    });
  });

  describe("loop: false (clamp)", () => {
    const config = cfg({ orientation: "vertical", loop: false });

    it("down at end → stays at end", () => {
      const result = resolveNavigate("e", "down", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("e");
    });

    it("up at start → stays at start", () => {
      const result = resolveNavigate("a", "up", ITEMS, config, NO_SPATIAL);
      expect(result.targetId).toBe("a");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// §3.2 Home / End
// ═══════════════════════════════════════════════════════════════════

describe("Navigate: Home / End (SPEC §3.2)", () => {
  const config = cfg({ orientation: "vertical" });

  it("home → moves to first item", () => {
    const result = resolveNavigate("c", "home", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("end → moves to last item", () => {
    const result = resolveNavigate("c", "end", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("e");
  });

  it("home when already at first → stays", () => {
    const result = resolveNavigate("a", "home", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("end when already at last → stays", () => {
    const result = resolveNavigate("e", "end", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("e");
  });

  it("home with horizontal orientation", () => {
    const hConfig = cfg({ orientation: "horizontal" });
    const result = resolveNavigate("c", "home", ITEMS, hConfig, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("end with horizontal orientation", () => {
    const hConfig = cfg({ orientation: "horizontal" });
    const result = resolveNavigate("c", "end", ITEMS, hConfig, NO_SPATIAL);
    expect(result.targetId).toBe("e");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════════════════════════════════

describe("Navigate: Edge Cases", () => {
  it("empty items → returns null", () => {
    const config = cfg();
    const result = resolveNavigate("a", "down", [], config, NO_SPATIAL);
    expect(result.targetId).toBeNull();
  });

  it("null currentId → resolves via entry strategy", () => {
    const config = cfg({ entry: "first" });
    const result = resolveNavigate(null, "down", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("null currentId with entry: last → resolves to last", () => {
    const config = cfg({ entry: "last" });
    const result = resolveNavigate(null, "down", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("e");
  });

  it("currentId not in items → falls back to first", () => {
    const config = cfg();
    const result = resolveNavigate("z", "down", ITEMS, config, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("single item, down → stays (no loop)", () => {
    const config = cfg({ loop: false });
    const result = resolveNavigate("a", "down", ["a"], config, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("single item, down → stays (with loop)", () => {
    const config = cfg({ loop: true });
    const result = resolveNavigate("a", "down", ["a"], config, NO_SPATIAL);
    expect(result.targetId).toBe("a");
  });

  it("consecutive moves traverse all items", () => {
    const config = cfg({ orientation: "vertical" });
    let current = "a";
    const visited: string[] = [current];
    for (let i = 1; i < ITEMS.length; i++) {
      const result = resolveNavigate(
        current,
        "down",
        ITEMS,
        config,
        NO_SPATIAL,
      );
      current = result.targetId!;
      visited.push(current);
    }
    expect(visited).toEqual(ITEMS);
  });
});
