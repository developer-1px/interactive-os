/**
 * OS Selection Commands — Unit Tests
 *
 * Tests OS_SELECTION_CLEAR.
 * SET/ADD/REMOVE/TOGGLE were removed — OS_SELECT(mode:...) covers all use cases.
 */

import { OS_SELECTION_CLEAR } from "@os/3-commands/selection/selection";
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
// OS_SELECTION_CLEAR
// ═══════════════════════════════════════════════════════════════════

describe("OS_SELECTION_CLEAR", () => {
  it("clears all selection and anchor", () => {
    setupZone("z1", ["item-1", "item-2", "item-3"], "item-2");

    os.dispatch(OS_SELECTION_CLEAR({ zoneId: "z1" }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });

  it("is idempotent on empty selection", () => {
    setupZone("z1", []);

    os.dispatch(OS_SELECTION_CLEAR({ zoneId: "z1" }));

    const zone = getZone("z1");
    expect(zone?.selection).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });
});
