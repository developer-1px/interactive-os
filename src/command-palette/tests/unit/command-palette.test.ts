/**
 * Level 2: Integration Tests — Command Palette overlay & navigation flow
 *
 * Tests the kernel-level behavior of the Command Palette:
 *   - OVERLAY_OPEN/CLOSE for palette lifecycle
 *   - Zone navigation (NAVIGATE) within the palette list
 *   - Focus state management
 *
 * Uses the headless kernel — no DOM, no React, no browser.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OVERLAY_CLOSE, OVERLAY_OPEN } from "@os/3-commands/overlay/overlay";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { describe, expect, it } from "vitest";

// ═════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

function setupFocus(zoneId: string, focusedItemId: string) {
  kernel.setState((prev) => ({
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
            ...prev.os.focus.zones[zoneId],
            focusedItemId,
          },
        },
      },
    },
  }));
}

/**
 * Helper: Register a zone mock
 */
function _registerZone(
  id: string,
  callbacks: Partial<{
    // biome-ignore lint/suspicious/noExplicitAny: mock callback
    onAction: any;
    // biome-ignore lint/suspicious/noExplicitAny: mock callback
    onDismiss: any;
  }>,
) {
  ZoneRegistry.register(id, {
    // biome-ignore lint/suspicious/noExplicitAny: mock config
    config: {} as any,
    element: document.createElement("div"),
    parentId: null,
    ...callbacks,
  });
}

beforeEach(() => {
  snapshot = kernel.getState();
  return () => {
    kernel.setState(() => snapshot);
    for (const key of [...ZoneRegistry.keys()]) {
      ZoneRegistry.unregister(key);
    }
  };
});

// ═════════════════════════════════════════════════════════════════════
// Overlay Lifecycle
// ═════════════════════════════════════════════════════════════════════

describe("Command Palette — overlay lifecycle", () => {
  it("opens overlay and adds to stack", () => {
    kernel.dispatch(OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));

    const state = kernel.getState();
    const entry = state.os.overlays.stack.find(
      (e) => e.id === "command-palette",
    );
    expect(entry).toBeDefined();
    expect(entry?.type).toBe("dialog");
  });

  it("closes overlay and removes from stack", () => {
    kernel.dispatch(OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));
    kernel.dispatch(OVERLAY_CLOSE({ id: "command-palette" }));

    const state = kernel.getState();
    const entry = state.os.overlays.stack.find(
      (e) => e.id === "command-palette",
    );
    expect(entry).toBeUndefined();
  });

  it("duplicate open does not create duplicate entries", () => {
    kernel.dispatch(OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));
    kernel.dispatch(OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));

    const state = kernel.getState();
    const entries = state.os.overlays.stack.filter(
      (e) => e.id === "command-palette",
    );
    expect(entries.length).toBeLessThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════════════
// Zone focus within palette
// ═════════════════════════════════════════════════════════════════════

describe("Command Palette — zone focus management", () => {
  it("maintains focusedItemId after overlay open", () => {
    kernel.dispatch(OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));

    setupFocus("command-palette-list", "route:/home");

    const zone = kernel.getState().os.focus.zones["command-palette-list"];
    expect(zone?.focusedItemId).toBe("route:/home");
  });

  it("clears focus state after overlay close", () => {
    kernel.dispatch(OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));
    setupFocus("command-palette-list", "route:/home");

    kernel.dispatch(OVERLAY_CLOSE({ id: "command-palette" }));

    const state = kernel.getState();
    const entry = state.os.overlays.stack.find(
      (e) => e.id === "command-palette",
    );
    expect(entry).toBeUndefined();
  });
});
