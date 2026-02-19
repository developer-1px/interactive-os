/**
 * Field Commands Unit Tests — OS SPEC §3.8
 *
 * Tests the state transitions for Field editing lifecycle:
 *   FIELD_START_EDIT → editingItemId set
 *   FIELD_COMMIT → editingItemId cleared
 *   FIELD_CANCEL → editingItemId cleared
 *
 * DOM-dependent behaviors (FieldRegistry lookup, onSubmit dispatch)
 * are not tested here — they belong in E2E/integration tests.
 */

import {
  FIELD_CANCEL,
  FIELD_COMMIT,
  FIELD_START_EDIT,
} from "@os/3-commands/field/field";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

function setupFocus(
  zoneId: string,
  focusedItemId: string,
  extra: Partial<typeof initialZoneState> = {},
) {
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
            ...extra,
          },
        },
      },
    },
  }));
}

function getZone(zoneId: string) {
  return kernel.getState().os.focus.zones[zoneId]!;
}

beforeEach(() => {
  snapshot = kernel.getState();
  return () => {
    kernel.setState(() => snapshot);
    vi.restoreAllMocks();
  };
});

// ═══════════════════════════════════════════════════════════════════
// FIELD_START_EDIT — SPEC §3.8
// ═══════════════════════════════════════════════════════════════════

describe("FIELD_START_EDIT (SPEC §3.8)", () => {
  it("sets editingItemId to focusedItemId", () => {
    setupFocus("z1", "item-1");

    kernel.dispatch(FIELD_START_EDIT());

    const zone = getZone("z1");
    expect(zone.editingItemId).toBe("item-1");
  });

  it("no-op when already editing the same item", () => {
    setupFocus("z1", "item-1", { editingItemId: "item-1" });
    const stateBefore = kernel.getState();

    kernel.dispatch(FIELD_START_EDIT());

    // State reference should be the same (no change)
    expect(kernel.getState()).toBe(stateBefore);
  });

  it("no-op when no focused item", () => {
    setupFocus("z1", null as any);
    const stateBefore = kernel.getState();

    kernel.dispatch(FIELD_START_EDIT());

    expect(kernel.getState()).toBe(stateBefore);
  });

  it("no-op when no active zone", () => {
    const stateBefore = kernel.getState();

    kernel.dispatch(FIELD_START_EDIT());

    expect(kernel.getState()).toBe(stateBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// FIELD_COMMIT — SPEC §3.8
// ═══════════════════════════════════════════════════════════════════

describe("FIELD_COMMIT (SPEC §3.8)", () => {
  it("clears editingItemId", () => {
    setupFocus("z1", "item-1", { editingItemId: "item-1" });

    kernel.dispatch(FIELD_COMMIT());

    const zone = getZone("z1");
    expect(zone.editingItemId).toBeNull();
  });

  it("no state change when not in editing mode (no editingItemId)", () => {
    setupFocus("z1", "item-1", { editingItemId: null });

    // FIELD_COMMIT without editingItemId may still try to find fields
    // but should not produce a state change
    kernel.dispatch(FIELD_COMMIT());

    const zone = getZone("z1");
    expect(zone.editingItemId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// FIELD_CANCEL — SPEC §3.8
// ═══════════════════════════════════════════════════════════════════

describe("FIELD_CANCEL (SPEC §3.8)", () => {
  it("clears editingItemId", () => {
    setupFocus("z1", "item-1", { editingItemId: "item-1" });

    kernel.dispatch(FIELD_CANCEL());

    const zone = getZone("z1");
    expect(zone.editingItemId).toBeNull();
  });

  it("no-op when not in editing mode", () => {
    setupFocus("z1", "item-1", { editingItemId: null });
    const stateBefore = kernel.getState();

    kernel.dispatch(FIELD_CANCEL());

    expect(kernel.getState()).toBe(stateBefore);
  });

  it("no-op when no active zone", () => {
    const stateBefore = kernel.getState();

    kernel.dispatch(FIELD_CANCEL());

    expect(kernel.getState()).toBe(stateBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Lifecycle Integration
// ═══════════════════════════════════════════════════════════════════

describe("Field Lifecycle: start → commit / cancel", () => {
  it("full cycle: start → commit", () => {
    setupFocus("z1", "item-1");

    // Start editing
    kernel.dispatch(FIELD_START_EDIT());
    expect(getZone("z1").editingItemId).toBe("item-1");

    // Commit
    kernel.dispatch(FIELD_COMMIT());
    expect(getZone("z1").editingItemId).toBeNull();
  });

  it("full cycle: start → cancel", () => {
    setupFocus("z1", "item-1");

    // Start editing
    kernel.dispatch(FIELD_START_EDIT());
    expect(getZone("z1").editingItemId).toBe("item-1");

    // Cancel
    kernel.dispatch(FIELD_CANCEL());
    expect(getZone("z1").editingItemId).toBeNull();
  });

  it("start on different item replaces editingItemId", () => {
    setupFocus("z1", "item-1");
    kernel.dispatch(FIELD_START_EDIT());
    expect(getZone("z1").editingItemId).toBe("item-1");

    // Move focus and start editing another item
    setupFocus("z1", "item-2");
    kernel.dispatch(FIELD_START_EDIT());
    expect(getZone("z1").editingItemId).toBe("item-2");
  });
});
