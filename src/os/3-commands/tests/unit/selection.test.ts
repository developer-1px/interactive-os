/**
 * OS Selection Commands — Unit Tests
 *
 * Tests SELECTION_SET, SELECTION_ADD, SELECTION_REMOVE, SELECTION_TOGGLE, SELECTION_CLEAR
 * These are kernel commands that modify zone.selection and zone.selectionAnchor.
 */

import {
  SELECTION_ADD,
  SELECTION_CLEAR,
  SELECTION_REMOVE,
  SELECTION_SET,
  SELECTION_TOGGLE,
} from "@os/3-commands/selection/selection";
import { os } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it } from "vitest";

// ─── Helpers ───

let snapshot: ReturnType<typeof os.getState>;

function setupZone(
  zoneId: string,
  selection: string[] = [],
  anchor: string | null = null,
) {
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
            ...prev.os.focus.zones[zoneId],
            selection,
            selectionAnchor: anchor,
          },
        },
      },
    },
  }));
}

function getZone(zoneId: string) {
  return os.getState().os.focus.zones[zoneId];
}

beforeEach(() => {
  snapshot = os.getState();
  return () => {
    os.setState(() => snapshot);
  };
});

// ═══════════════════════════════════════════════════════════════════
// SELECTION_SET
// ═══════════════════════════════════════════════════════════════════

describe("SELECTION_SET", () => {
  it("replaces selection with given ids", () => {
    setupZone("z1", ["old-1", "old-2"]);

    os.dispatch(
      SELECTION_SET({ zoneId: "z1", ids: ["new-1", "new-2", "new-3"] }),
    );

    const zone = getZone("z1");
    expect(zone?.selection).toEqual(["new-1", "new-2", "new-3"]);
  });

  it("sets anchor to last item", () => {
    setupZone("z1");

    os.dispatch(SELECTION_SET({ zoneId: "z1", ids: ["a", "b", "c"] }));

    expect(getZone("z1")?.selectionAnchor).toBe("c");
  });

  it("sets anchor to null when ids is empty", () => {
    setupZone("z1", ["a"], "a");

    os.dispatch(SELECTION_SET({ zoneId: "z1", ids: [] }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECTION_ADD
// ═══════════════════════════════════════════════════════════════════

describe("SELECTION_ADD", () => {
  it("adds item to selection", () => {
    setupZone("z1", ["item-1"]);

    os.dispatch(SELECTION_ADD({ zoneId: "z1", id: "item-2" }));

    expect(getZone("z1")?.selection).toEqual(["item-1", "item-2"]);
  });

  it("does not duplicate existing item", () => {
    setupZone("z1", ["item-1"]);

    os.dispatch(SELECTION_ADD({ zoneId: "z1", id: "item-1" }));

    expect(getZone("z1")?.selection).toEqual(["item-1"]);
  });

  it("updates anchor to added item", () => {
    setupZone("z1", ["item-1"], "item-1");

    os.dispatch(SELECTION_ADD({ zoneId: "z1", id: "item-2" }));

    expect(getZone("z1")?.selectionAnchor).toBe("item-2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECTION_REMOVE
// ═══════════════════════════════════════════════════════════════════

describe("SELECTION_REMOVE", () => {
  it("removes item from selection", () => {
    setupZone("z1", ["item-1", "item-2", "item-3"]);

    os.dispatch(SELECTION_REMOVE({ zoneId: "z1", id: "item-2" }));

    expect(getZone("z1")?.selection).toEqual(["item-1", "item-3"]);
  });

  it("clears anchor if removed item was anchor", () => {
    setupZone("z1", ["item-1", "item-2"], "item-2");

    os.dispatch(SELECTION_REMOVE({ zoneId: "z1", id: "item-2" }));

    expect(getZone("z1")?.selectionAnchor).toBeNull();
  });

  it("preserves anchor if different item removed", () => {
    setupZone("z1", ["item-1", "item-2"], "item-2");

    os.dispatch(SELECTION_REMOVE({ zoneId: "z1", id: "item-1" }));

    expect(getZone("z1")?.selectionAnchor).toBe("item-2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECTION_TOGGLE
// ═══════════════════════════════════════════════════════════════════

describe("SELECTION_TOGGLE", () => {
  it("adds item if not in selection", () => {
    setupZone("z1", []);

    os.dispatch(SELECTION_TOGGLE({ zoneId: "z1", id: "item-1" }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual(["item-1"]);
    expect(zone?.selectionAnchor).toBe("item-1");
  });

  it("removes item if already in selection", () => {
    setupZone("z1", ["item-1", "item-2"], "item-1");

    os.dispatch(SELECTION_TOGGLE({ zoneId: "z1", id: "item-1" }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual(["item-2"]);
    expect(zone?.selectionAnchor).toBeNull();
  });

  it("sets anchor when adding", () => {
    setupZone("z1", ["item-1"], "item-1");

    os.dispatch(SELECTION_TOGGLE({ zoneId: "z1", id: "item-2" }));

    expect(getZone("z1")?.selectionAnchor).toBe("item-2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECTION_CLEAR
// ═══════════════════════════════════════════════════════════════════

describe("SELECTION_CLEAR", () => {
  it("clears all selection and anchor", () => {
    setupZone("z1", ["item-1", "item-2", "item-3"], "item-2");

    os.dispatch(SELECTION_CLEAR({ zoneId: "z1" }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });

  it("is idempotent on empty selection", () => {
    setupZone("z1", []);

    os.dispatch(SELECTION_CLEAR({ zoneId: "z1" }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });
});
