/**
 * OS_NAVIGATE — Headless Kernel Integration Test
 *
 * Tests the full OS_NAVIGATE pipeline without DOM:
 *   direction movement, wrap/clamp, followFocus, Shift+Arrow range selection,
 *   Home/End, disabled item skipping.
 *
 * APG Reference:
 *   - Arrow keys move focus within a widget (listbox, grid, tree)
 *   - Home/End move to first/last item
 *   - Selection follows focus when config.select.followFocus is true
 *   - Shift+Arrow extends selection range
 */

import { describe, expect, it } from "vitest";
import { createOsPage } from "@os/createOsPage";

// ═══════════════════════════════════════════════════════════════════
// Basic Navigation
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — Basic Movement", () => {
  it("ArrowDown: moves focus to next item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("b");
  });

  it("ArrowUp: moves focus to previous item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "c");

    t.dispatch(t.OS_NAVIGATE({ direction: "up" }));

    expect(t.focusedItemId()).toBe("b");
  });

  it("navigation updates lastFocusedId", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.zone()?.lastFocusedId).toBe("b");
  });

  it("navigation clears editingItemId", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "a");

    // Manually set editingItemId to simulate edit mode
    t.kernel.setState((s) => ({
      ...s,
      os: {
        ...s.os,
        focus: {
          ...s.os.focus,
          zones: {
            ...s.os.focus.zones,
            list: {
              ...s.os.focus.zones["list"]!,
              editingItemId: "a",
            },
          },
        },
      },
    }));

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.zone()?.editingItemId).toBeNull();
  });

  it("no active zone: OS_NAVIGATE does nothing", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);

    // No setActiveZone → no activeZoneId
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    // State unchanged
    expect(t.activeZoneId()).toBeNull();
  });

  it("empty items: OS_NAVIGATE does nothing", () => {
    const t = createOsPage();
    t.setItems([]);
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("a");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary: Clamp vs Wrap (loop)
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — Boundary Behavior", () => {
  it("clamp: at last item, ArrowDown stays (loop=false)", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "c");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("c");
  });

  it("clamp: at first item, ArrowUp stays (loop=false)", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "up" }));

    expect(t.focusedItemId()).toBe("a");
  });

  it("wrap: at last item, ArrowDown wraps to first (loop=true)", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "c");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("a");
  });

  it("wrap: at first item, ArrowUp wraps to last (loop=true)", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "up" }));

    expect(t.focusedItemId()).toBe("c");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — Home / End", () => {
  it("Home: moves to first item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setActiveZone("list", "c");

    t.dispatch(t.OS_NAVIGATE({ direction: "home" }));

    expect(t.focusedItemId()).toBe("a");
  });

  it("End: moves to last item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setActiveZone("list", "b");

    t.dispatch(t.OS_NAVIGATE({ direction: "end" }));

    expect(t.focusedItemId()).toBe("e");
  });

  it("Home at first item: no change", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "home" }));

    expect(t.focusedItemId()).toBe("a");
  });

  it("End at last item: no change", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setActiveZone("list", "c");

    t.dispatch(t.OS_NAVIGATE({ direction: "end" }));

    expect(t.focusedItemId()).toBe("c");
  });
});

// ═══════════════════════════════════════════════════════════════════
// followFocus — Selection follows focus (★ Recent Bug)
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — followFocus", () => {
  it("followFocus=true: ArrowDown updates selection to focused item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "a");
    // Set initial selection
    t.dispatch(t.OS_SELECT({ targetId: "a", mode: "replace" }));
    expect(t.selection()).toEqual(["a"]);

    // Navigate down → selection should follow
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("b");
    expect(t.selection()).toEqual(["b"]);
  });

  it("followFocus=true: ArrowUp updates selection", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "c");
    t.dispatch(t.OS_SELECT({ targetId: "c", mode: "replace" }));

    t.dispatch(t.OS_NAVIGATE({ direction: "up" }));

    expect(t.focusedItemId()).toBe("b");
    expect(t.selection()).toEqual(["b"]);
  });

  it("followFocus=true: selection anchor also updates", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.zone()?.selectionAnchor).toBe("b");
  });

  it("followFocus=false: ArrowDown does NOT change selection", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      select: {
        mode: "single",
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "a");
    t.dispatch(t.OS_SELECT({ targetId: "a", mode: "replace" }));

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("b");
    expect(t.selection()).toEqual(["a"]); // selection stays on "a"
  });

  it("followFocus=true + select.mode='none': no selection change", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      select: {
        mode: "none",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("b");
    expect(t.selection()).toEqual([]); // mode=none, no selection
  });

  it("followFocus + wrap: selection follows wrapped focus", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "c");
    t.dispatch(t.OS_SELECT({ targetId: "c", mode: "replace" }));

    // Wrap: c → a
    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("a");
    expect(t.selection()).toEqual(["a"]); // selection followed the wrap
  });

  it("followFocus: multiple navigations track correctly", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setConfig({
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    });
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.selection()).toEqual(["b"]);

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.selection()).toEqual(["c"]);

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.selection()).toEqual(["d"]);

    t.dispatch(t.OS_NAVIGATE({ direction: "up" }));
    expect(t.selection()).toEqual(["c"]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Shift+Arrow — Range Selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — Shift+Arrow Range Selection", () => {
  it("Shift+Down: extends selection range forward", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: false,
      },
    });
    t.setActiveZone("list", "b");
    // Set anchor
    t.dispatch(t.OS_SELECT({ targetId: "b", mode: "replace" }));

    // Shift+Down: b → c (range: b, c)
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));

    expect(t.focusedItemId()).toBe("c");
    expect(t.selection()).toEqual(["b", "c"]);
  });

  it("Shift+Down twice: extends range further", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: false,
      },
    });
    t.setActiveZone("list", "b");
    t.dispatch(t.OS_SELECT({ targetId: "b", mode: "replace" }));

    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));

    expect(t.focusedItemId()).toBe("d");
    expect(t.selection()).toEqual(["b", "c", "d"]);
  });

  it("Shift+Up: extends selection range backward", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: false,
      },
    });
    t.setActiveZone("list", "d");
    t.dispatch(t.OS_SELECT({ targetId: "d", mode: "replace" }));

    t.dispatch(t.OS_NAVIGATE({ direction: "up", select: "range" }));

    expect(t.focusedItemId()).toBe("c");
    expect(t.selection()).toEqual(["c", "d"]);
  });

  it("Shift+Down then Shift+Up: shrinks selection", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d", "e"]);
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: false,
      },
    });
    t.setActiveZone("list", "b");
    t.dispatch(t.OS_SELECT({ targetId: "b", mode: "replace" }));

    // Extend forward: b, c, d
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
    expect(t.selection()).toEqual(["b", "c", "d"]);

    // Shrink: b, c
    t.dispatch(t.OS_NAVIGATE({ direction: "up", select: "range" }));
    expect(t.selection()).toEqual(["b", "c"]);
  });

  it("Shift+Arrow does NOT overwrite selection when followFocus is also on", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c", "d"]);
    t.setConfig({
      select: {
        mode: "multiple",
        followFocus: true,
        disallowEmpty: false,
        range: true,
        toggle: false,
      },
    });
    t.setActiveZone("list", "b");
    t.dispatch(t.OS_SELECT({ targetId: "b", mode: "replace" }));

    // Shift+Down should extend range, not replace with single
    t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));

    expect(t.focusedItemId()).toBe("c");
    expect(t.selection()).toEqual(["b", "c"]); // range, not [c] from followFocus
  });
});

// ═══════════════════════════════════════════════════════════════════
// Orientation — Ignore cross-axis direction
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — Orientation", () => {
  it("vertical orientation: ArrowLeft/Right are ignored", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "b");

    t.dispatch(t.OS_NAVIGATE({ direction: "left" }));
    expect(t.focusedItemId()).toBe("b"); // unchanged

    t.dispatch(t.OS_NAVIGATE({ direction: "right" }));
    expect(t.focusedItemId()).toBe("b"); // unchanged
  });

  it("horizontal orientation: ArrowUp/Down are ignored", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "horizontal",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "b");

    t.dispatch(t.OS_NAVIGATE({ direction: "up" }));
    expect(t.focusedItemId()).toBe("b"); // unchanged

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
    expect(t.focusedItemId()).toBe("b"); // unchanged
  });

  it("horizontal orientation: ArrowRight moves to next", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "horizontal",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", "a");

    t.dispatch(t.OS_NAVIGATE({ direction: "right" }));
    expect(t.focusedItemId()).toBe("b");

    t.dispatch(t.OS_NAVIGATE({ direction: "left" }));
    expect(t.focusedItemId()).toBe("a");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Entry — First focus when currentId is null
// ═══════════════════════════════════════════════════════════════════

describe("OS_NAVIGATE — Entry (no current focus)", () => {
  it("entry=first: first navigation focuses first item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first",
        recovery: "next",
      },
    });
    t.setActiveZone("list", null);

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("a");
  });

  it("entry=last: first navigation focuses last item", () => {
    const t = createOsPage();
    t.setItems(["a", "b", "c"]);
    t.setConfig({
      navigate: {
        orientation: "vertical",
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "last",
        recovery: "next",
      },
    });
    t.setActiveZone("list", null);

    t.dispatch(t.OS_NAVIGATE({ direction: "down" }));

    expect(t.focusedItemId()).toBe("c");
  });
});
