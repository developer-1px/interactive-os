/**
 * RECOVER — Unit Tests
 *
 * SPEC §3.1: RECOVER restores focus after focused element removal.
 * Priority: recoveryTargetId → lastFocusedId → first item in DOM.
 *
 * RECOVER uses ctx.inject(DOM_ITEMS), so tests must set up
 * ZoneRegistry + DOM elements for the context provider.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { RECOVER } from "@os/3-commands/focus/recover";
import { os } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it } from "vitest";

let snapshot: ReturnType<typeof os.getState>;
let container: HTMLDivElement;

function setupZone(
  zoneId: string,
  itemIds: string[],
  stateOverrides: Partial<typeof initialZoneState> = {},
) {
  // Set up DOM
  container = document.createElement("div");
  container.setAttribute("data-focus-group", zoneId);
  for (const id of itemIds) {
    const el = document.createElement("div");
    el.setAttribute("data-item-id", id);
    container.appendChild(el);
  }
  document.body.appendChild(container);

  // Register in ZoneRegistry
  ZoneRegistry.register(zoneId, {
    config: {} as any,
    element: container,
    parentId: null,
  });

  // Set kernel state
  os.setState((prev) => ({
    ...prev,
    os: {
      ...prev.os,
      focus: {
        ...prev.os.focus,
        activeZoneId: zoneId,
        zones: {
          ...prev.os.focus.zones,
          [zoneId]: {
            ...initialZoneState,
            ...stateOverrides,
          },
        },
      },
    },
  }));
}

beforeEach(() => {
  snapshot = os.getState();
  return () => {
    os.setState(() => snapshot);
    container?.remove();
    for (const key of [...ZoneRegistry.keys()]) {
      ZoneRegistry.unregister(key);
    }
  };
});

describe("RECOVER (SPEC §3.1)", () => {
  it("re-focuses current item if it still exists in DOM", () => {
    setupZone("z1", ["item-1", "item-2", "item-3"], {
      focusedItemId: "item-2",
    });

    os.dispatch(RECOVER());

    // State should NOT change — item is still present
    const zone = os.getState().os.focus.zones["z1"];
    expect(zone?.focusedItemId).toBe("item-2");
  });

  it("uses recoveryTargetId when focused item is removed", () => {
    // item-2 was focused, but it's been removed from DOM
    // recoveryTargetId points to item-3
    setupZone("z1", ["item-1", "item-3"], {
      focusedItemId: "item-2",
      recoveryTargetId: "item-3",
      lastFocusedId: "item-1",
    });

    os.dispatch(RECOVER());

    const zone = os.getState().os.focus.zones["z1"];
    expect(zone?.focusedItemId).toBe("item-3");
  });

  it("falls back to first item when recoveryTargetId is also removed", () => {
    // Both focused item and recovery target are gone
    setupZone("z1", ["item-1", "item-4"], {
      focusedItemId: "item-2",
      recoveryTargetId: "item-3",
      lastFocusedId: "item-2",
    });

    os.dispatch(RECOVER());

    const zone = os.getState().os.focus.zones["z1"];
    expect(zone?.focusedItemId).toBe("item-1");
  });

  it("does nothing when no active zone", () => {
    os.setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        focus: { ...prev.os.focus, activeZoneId: null },
      },
    }));

    // Should not throw
    os.dispatch(RECOVER());
  });

  it("does nothing when zone state is missing", () => {
    os.setState((prev) => ({
      ...prev,
      os: {
        ...prev.os,
        focus: { ...prev.os.focus, activeZoneId: "ghost" },
      },
    }));

    // Should not throw
    os.dispatch(RECOVER());
  });

  it("does nothing when DOM has no items", () => {
    setupZone("z1", [], {
      focusedItemId: "item-1",
      recoveryTargetId: null,
    });

    os.dispatch(RECOVER());

    // focusedItemId should remain unchanged (RECOVER returns early)
    const zone = os.getState().os.focus.zones["z1"];
    expect(zone?.focusedItemId).toBe("item-1");
  });

  it("updates lastFocusedId when recovering to a new target", () => {
    setupZone("z1", ["item-1", "item-3"], {
      focusedItemId: "item-2",
      recoveryTargetId: "item-3",
      lastFocusedId: "item-2",
    });

    os.dispatch(RECOVER());

    const zone = os.getState().os.focus.zones["z1"];
    expect(zone?.lastFocusedId).toBe("item-3");
  });
});
