/**
 * TAB Command — Headless Kernel Integration Test (PoC)
 *
 * Tests the FULL command pipeline without DOM:
 *   state + context(mock) → dispatch(TAB) → new state
 *
 * This proves that "wiring correctness" can be tested
 * headlessly via the kernel's defineContext override.
 */

import { createKernel } from "@kernel";
import type { AppState } from "@os/kernel";
import { initialOSState } from "@os/state/initial";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { resolveTab } from "../../tab/resolveTab";

// ═══════════════════════════════════════════════════════════════════
// Test Kernel Factory — independent instance per test
// ═══════════════════════════════════════════════════════════════════

function createTestKernel(overrides?: Partial<AppState>) {
  const initialState: AppState = {
    os: initialOSState,
    apps: {},
    ...overrides,
  };

  const kernel = createKernel<AppState>(initialState);

  // ─── Define contexts with mock providers ───
  const mockItems = { current: [] as string[] };
  const mockZoneOrder = {
    current: [] as Array<{
      zoneId: string;
      firstItemId: string | null;
      lastItemId: string | null;
      entry: "first" | "last" | "restore" | "selected";
      selectedItemId: string | null;
      lastFocusedId: string | null;
    }>,
  };
  const mockConfig = {
    current: {
      navigate: {
        orientation: "vertical" as const,
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first" as const,
      },
      tab: { behavior: "escape" as string, restoreFocus: false },
      select: {
        mode: "single" as const,
        followFocus: false,
        range: false,
        toggle: false,
        disallowEmpty: false,
      },
      activate: { mode: "manual" as const },
      dismiss: { escape: "none" as const, outsideClick: "none" as const },
      project: {
        autoFocus: false,
        virtualFocus: false,
      },
    },
  };

  const DOM_ITEMS = kernel.defineContext("dom-items", () => mockItems.current);
  const ZONE_CONFIG = kernel.defineContext(
    "zone-config",
    () => mockConfig.current,
  );
  const DOM_ZONE_ORDER = kernel.defineContext(
    "dom-zone-order",
    () => mockZoneOrder.current,
  );

  // ─── Register TAB command ───
  const TAB = kernel.defineCommand(
    "OS_TAB",
    [DOM_ITEMS, ZONE_CONFIG, DOM_ZONE_ORDER],
    (ctx: any) => (payload: { direction?: "forward" | "backward" }) => {
      const { activeZoneId } = ctx.state.os.focus;
      if (!activeZoneId) return;

      const zone = ctx.state.os.focus.zones[activeZoneId];
      if (!zone) return;

      const items: string[] = ctx.inject(DOM_ITEMS);
      const config = ctx.inject(ZONE_CONFIG);
      const zoneOrder = ctx.inject(DOM_ZONE_ORDER);
      const direction = payload.direction ?? "forward";

      const result = resolveTab(
        zone.focusedItemId,
        items,
        config.tab.behavior,
        direction,
        activeZoneId,
        zoneOrder,
      );

      if (!result) return;

      if (result.type === "within") {
        return {
          state: produce(ctx.state, (draft: AppState) => {
            const z = ensureZone(draft.os, activeZoneId);
            z.focusedItemId = result.itemId;
            z.lastFocusedId = result.itemId;
          }),
        };
      }

      // escape to different zone
      return {
        state: produce(ctx.state, (draft: AppState) => {
          draft.os.focus.activeZoneId = result.zoneId;
          const z = ensureZone(draft.os, result.zoneId);
          z.focusedItemId = result.itemId;
          z.lastFocusedId = result.itemId;
        }),
      };
    },
  );

  return { kernel, TAB, mockItems, mockZoneOrder, mockConfig };
}

// ═══════════════════════════════════════════════════════════════════
// Helper: set up state with active zone
// ═══════════════════════════════════════════════════════════════════

function withActiveZone(
  kernel: ReturnType<typeof createKernel<AppState>>,
  zoneId: string,
  focusedItemId: string,
) {
  kernel.setState((s) =>
    produce(s, (draft) => {
      draft.os.focus.activeZoneId = zoneId;
      const z = ensureZone(draft.os, zoneId);
      z.focusedItemId = focusedItemId;
      z.lastFocusedId = focusedItemId;
    }),
  );
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("TAB Command — Headless Kernel Integration", () => {
  // ─── escape behavior ───

  it("escape forward: moves to next zone", () => {
    const { kernel, TAB, mockItems, mockZoneOrder, mockConfig } =
      createTestKernel();

    mockItems.current = ["item-a", "item-b", "item-c"];
    mockZoneOrder.current = [
      {
        zoneId: "list",
        firstItemId: "item-a",
        lastItemId: "item-c",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "sidebar",
        firstItemId: "cat-1",
        lastItemId: "cat-3",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    mockConfig.current = {
      ...mockConfig.current,
      tab: { behavior: "escape", restoreFocus: false },
    };

    withActiveZone(kernel, "list", "item-b");

    kernel.dispatch(TAB({ direction: "forward" }));

    const state = kernel.getState();
    expect(state.os.focus.activeZoneId).toBe("sidebar");
    expect(state.os.focus.zones["sidebar"]!.focusedItemId).toBe("cat-1");
  });

  it("escape backward: moves to previous zone", () => {
    const { kernel, TAB, mockItems, mockZoneOrder, mockConfig } =
      createTestKernel();

    mockItems.current = ["cat-1", "cat-2", "cat-3"];
    mockZoneOrder.current = [
      {
        zoneId: "list",
        firstItemId: "item-a",
        lastItemId: "item-c",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "sidebar",
        firstItemId: "cat-1",
        lastItemId: "cat-3",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    mockConfig.current = {
      ...mockConfig.current,
      tab: { behavior: "escape", restoreFocus: false },
    };

    withActiveZone(kernel, "sidebar", "cat-2");

    kernel.dispatch(TAB({ direction: "backward" }));

    const state = kernel.getState();
    expect(state.os.focus.activeZoneId).toBe("list");
    expect(state.os.focus.zones["list"]!.focusedItemId).toBe("item-c");
  });

  // ─── trap behavior ───

  it("trap: cycles within zone (forward wrap)", () => {
    const { kernel, TAB, mockItems, mockConfig } = createTestKernel();

    mockItems.current = ["t-0", "t-1", "t-2"];
    mockConfig.current = {
      ...mockConfig.current,
      tab: { behavior: "trap", restoreFocus: false },
    };

    withActiveZone(kernel, "dialog", "t-2");

    kernel.dispatch(TAB({ direction: "forward" }));

    const state = kernel.getState();
    expect(state.os.focus.activeZoneId).toBe("dialog");
    expect(state.os.focus.zones["dialog"]!.focusedItemId).toBe("t-0");
  });

  // ─── flow behavior ───

  it("flow: walks within zone then escapes at boundary", () => {
    const { kernel, TAB, mockItems, mockZoneOrder, mockConfig } =
      createTestKernel();

    mockItems.current = ["f-0", "f-1", "f-2"];
    mockZoneOrder.current = [
      {
        zoneId: "toolbar",
        firstItemId: "f-0",
        lastItemId: "f-2",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "next-zone",
        firstItemId: "n-0",
        lastItemId: "n-2",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    mockConfig.current = {
      ...mockConfig.current,
      tab: { behavior: "flow", restoreFocus: false },
    };

    withActiveZone(kernel, "toolbar", "f-0");

    // Tab forward: f-0 → f-1
    kernel.dispatch(TAB({ direction: "forward" }));
    expect(kernel.getState().os.focus.activeZoneId).toBe("toolbar");
    expect(kernel.getState().os.focus.zones["toolbar"]!.focusedItemId).toBe(
      "f-1",
    );

    // Tab forward: f-1 → f-2
    kernel.dispatch(TAB({ direction: "forward" }));
    expect(kernel.getState().os.focus.zones["toolbar"]!.focusedItemId).toBe(
      "f-2",
    );

    // Tab forward: f-2 → escape to next-zone
    kernel.dispatch(TAB({ direction: "forward" }));
    expect(kernel.getState().os.focus.activeZoneId).toBe("next-zone");
    expect(kernel.getState().os.focus.zones["next-zone"]!.focusedItemId).toBe(
      "n-0",
    );
  });

  // ─── edge cases ───

  it("single zone: Tab does nothing", () => {
    const { kernel, TAB, mockItems, mockZoneOrder, mockConfig } =
      createTestKernel();

    mockItems.current = ["only-0", "only-1"];
    mockZoneOrder.current = [
      {
        zoneId: "only",
        firstItemId: "only-0",
        lastItemId: "only-1",
        entry: "first",
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    mockConfig.current = {
      ...mockConfig.current,
      tab: { behavior: "escape", restoreFocus: false },
    };

    withActiveZone(kernel, "only", "only-0");

    kernel.dispatch(TAB({ direction: "forward" }));

    // Should stay — single zone, nowhere to wrap to
    expect(kernel.getState().os.focus.activeZoneId).toBe("only");
    expect(kernel.getState().os.focus.zones["only"]!.focusedItemId).toBe(
      "only-0",
    );
  });

  it("3-zone cycle: list → sidebar → toolbar (forward)", () => {
    const { kernel, TAB, mockItems, mockZoneOrder, mockConfig } =
      createTestKernel();

    const zones = [
      {
        zoneId: "list",
        firstItemId: "l-0",
        lastItemId: "l-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "sidebar",
        firstItemId: "s-0",
        lastItemId: "s-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
      {
        zoneId: "toolbar",
        firstItemId: "t-0",
        lastItemId: "t-2",
        entry: "first" as const,
        selectedItemId: null,
        lastFocusedId: null,
      },
    ];
    mockZoneOrder.current = zones;
    mockConfig.current = {
      ...mockConfig.current,
      tab: { behavior: "escape", restoreFocus: false },
    };

    // Start at list
    mockItems.current = ["l-0", "l-1", "l-2"];
    withActiveZone(kernel, "list", "l-1");

    kernel.dispatch(TAB({ direction: "forward" }));
    expect(kernel.getState().os.focus.activeZoneId).toBe("sidebar");

    // Now at sidebar — update items
    mockItems.current = ["s-0", "s-1", "s-2"];
    kernel.dispatch(TAB({ direction: "forward" }));
    expect(kernel.getState().os.focus.activeZoneId).toBe("toolbar");

    // At toolbar — wraps back to list
    mockItems.current = ["t-0", "t-1", "t-2"];
    kernel.dispatch(TAB({ direction: "forward" }));
    expect(kernel.getState().os.focus.activeZoneId).toBe("list"); // wrap!
  });
});
