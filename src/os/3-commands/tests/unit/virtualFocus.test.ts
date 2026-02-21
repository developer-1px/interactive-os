/**
 * Virtual Focus Unit Tests — T5a
 *
 * Checks that OS_NAVIGATE and OS_FOCUS commands respect the `virtualFocus` project config.
 * When `virtualFocus: true`, DOM focus stays on the container (e.g. input) while
 * logically moving the active item state.
 *
 * Architecture note: OS_FOCUS/OS_NAVIGATE no longer emit `focus` effects.
 * DOM focus is handled by FocusItem.useLayoutEffect (state → render → DOM focus).
 * DOM focus is handled by FocusItem.useLayoutEffect (state → render → DOM focus).
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_FOCUS } from "@os/3-commands/focus";
import { OS_NAVIGATE } from "@os/3-commands/navigate";
import { os } from "@os/kernel";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import { initialOSState } from "@os/state/initial";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resetState() {
  os.setState((prev) => ({
    ...prev,
    os: JSON.parse(JSON.stringify(initialOSState)),
  }));
}

/**
 * Create a real DOM element with data-item-id children,
 * so that DOM_ITEMS context provider can query them.
 */
function createZoneElement(zoneId: string, items: string[]): HTMLElement {
  const container = document.createElement("div");
  container.setAttribute("data-focus-group", zoneId);
  for (const itemId of items) {
    const el = document.createElement("div");
    el.setAttribute("data-item-id", itemId);
    el.id = itemId;
    container.appendChild(el);
  }
  document.body.appendChild(container);
  return container;
}

function registerVirtualZone(id: string, items: string[]) {
  const element = createZoneElement(id, items);

  // Register zone with DEFAULT_CONFIG + virtualFocus: true override
  ZoneRegistry.register(id, {
    config: {
      ...DEFAULT_CONFIG,
      project: { ...DEFAULT_CONFIG.project, virtualFocus: true },
    },
    element,
    parentId: null,
  });

  // Set initial state — zone is active + first item focused
  os.setState((prev) => ({
    ...prev,
    os: {
      ...prev.os,
      focus: {
        ...prev.os.focus,
        activeZoneId: id,
        zones: {
          ...prev.os.focus.zones,
          [id]: {
            focusedItemId: items[0] || null,
            lastFocusedId: items[0] || null,
            selection: [],
            selectionAnchor: null,
            expandedItems: [],
            editingItemId: null,
            stickyX: undefined,
            stickyY: undefined,
          } as any,
        },
      },
    },
  }));
}

function cleanup() {
  // Remove all zone elements from DOM
  document.querySelectorAll("[data-focus-group]").forEach((el) => el.remove());
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Virtual Focus (T5a)", () => {
  beforeEach(() => {
    resetState();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("OS_NAVIGATE with virtualFocus: true", () => {
    it("updates state but suppresses focus effect", () => {
      const items = ["item-1", "item-2"];
      registerVirtualZone("z-virtual", items);

      // Verify setup
      const stateBefore = os.getState().os.focus.zones["z-virtual"];
      expect(stateBefore?.focusedItemId).toBe("item-1");

      // Dispatch OS_NAVIGATE (down)
      os.dispatch(OS_NAVIGATE({ direction: "down" }));

      // 1. State must update — focusedItemId moves to item-2
      const stateAfter = os.getState().os.focus.zones["z-virtual"];
      expect(stateAfter?.focusedItemId).toBe("item-2");

      // 2. Verify effects via transaction log
      const tx = os.inspector.getLastTransaction();
      expect(tx).toBeDefined();
      expect(tx?.effects).toBeDefined();
      // virtualFocus: focus effect must be absent (undefined → not in effects)
      expect((tx?.effects as any)?.focus).toBeUndefined();
      // scroll effect should still be present
      expect((tx?.effects as any)?.scroll).toBe("item-2");
    });

    it("wraps or stops at boundary based on config", () => {
      const items = ["item-1", "item-2"];
      registerVirtualZone("z-virtual", items);

      // Navigate down twice — item-1 → item-2 → stop (wrap: false)
      os.dispatch(OS_NAVIGATE({ direction: "down" }));
      os.dispatch(OS_NAVIGATE({ direction: "down" }));

      const state = os.getState().os.focus.zones["z-virtual"];
      // Should stay at item-2 (no wrap)
      expect(state?.focusedItemId).toBe("item-2");
    });

    it("navigates up from item-2 to item-1", () => {
      const items = ["item-1", "item-2"];
      registerVirtualZone("z-virtual", items);

      // Move to item-2 first
      os.dispatch(OS_NAVIGATE({ direction: "down" }));
      expect(os.getState().os.focus.zones["z-virtual"]?.focusedItemId).toBe(
        "item-2",
      );

      // Navigate up
      os.dispatch(OS_NAVIGATE({ direction: "up" }));
      expect(os.getState().os.focus.zones["z-virtual"]?.focusedItemId).toBe(
        "item-1",
      );
    });
  });

  describe("OS_FOCUS with virtualFocus: true", () => {
    it("updates state but suppresses focus effect", () => {
      const items = ["item-1", "item-2"];
      registerVirtualZone("z-virtual", items);

      // Dispatch OS_FOCUS to item-2
      os.dispatch(OS_FOCUS({ zoneId: "z-virtual", itemId: "item-2" }));

      // 1. Check State Update
      const stateAfter = os.getState().os.focus.zones["z-virtual"];
      expect(stateAfter?.focusedItemId).toBe("item-2");

      // os.dispatch returns void — check transaction log for effects
      const tx = os.inspector.getLastTransaction();
      expect((tx?.effects as any)?.focus).toBeUndefined();
    });

    it("does not emit focus effect (DOM focus is handled by FocusItem)", () => {
      const items = ["item-A"];
      const element = createZoneElement("z-normal", items);

      // Register normal zone (virtualFocus: false)
      ZoneRegistry.register("z-normal", {
        config: {
          ...DEFAULT_CONFIG,
          project: { ...DEFAULT_CONFIG.project, virtualFocus: false },
        },
        element,
        parentId: null,
      });

      os.dispatch(OS_FOCUS({ zoneId: "z-normal", itemId: "item-A" }));

      // New architecture: OS_FOCUS returns { state } only.
      // DOM focus is handled by FocusItem.useLayoutEffect, not by 4-effects/focus.
      const tx = os.inspector.getLastTransaction();
      expect((tx?.effects as any)?.focus).toBeUndefined();
      // State must still update
      expect(os.getState().os.focus.zones["z-normal"]?.focusedItemId).toBe(
        "item-A",
      );
    });
  });
});
