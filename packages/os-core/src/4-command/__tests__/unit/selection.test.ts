/**
 * OS Selection Commands — Unit Tests
 *
 * Tests OS_SELECTION_CLEAR.
 * SET/ADD/REMOVE/TOGGLE were removed — OS_SELECT(mode:...) covers all use cases.
 */

import { OS_SELECTION_CLEAR } from "@os-core/4-command/selection/selection";
import { os } from "@os-core/engine/kernel";
import { initialZoneState } from "@os-core/schema/state/initial";
import { beforeEach, describe, expect, it } from "vitest";

// ─── Helpers ───

let snapshot: ReturnType<typeof os.getState>;

/** Build items map with aria-selected for the given IDs */
function buildSelectedItems(
  ids: string[],
): Record<string, { "aria-selected"?: boolean }> {
  const items: Record<string, { "aria-selected"?: boolean }> = {};
  for (const id of ids) {
    items[id] = { "aria-selected": true };
  }
  return items;
}

/** Get selected item IDs from zone */
function getSelection(zoneId: string): string[] {
  const zone = os.getState().os.focus.zones[zoneId];
  return Object.entries(zone?.items ?? {})
    .filter(([, s]) => s?.["aria-selected"])
    .map(([id]) => id);
}

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
            items: buildSelectedItems(selection),
            selectionAnchor: anchor,
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
  };
});

// ═══════════════════════════════════════════════════════════════════
// OS_SELECTION_CLEAR
// ═══════════════════════════════════════════════════════════════════

describe("OS_SELECTION_CLEAR", () => {
  it("clears all selection and anchor", () => {
    setupZone("z1", ["item-1", "item-2", "item-3"], "item-2");

    os.dispatch(OS_SELECTION_CLEAR({ zoneId: "z1" }));

    const zone = os.getState().os.focus.zones["z1"];
    expect(getSelection("z1")).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });

  it("is idempotent on empty selection", () => {
    setupZone("z1", []);

    os.dispatch(OS_SELECTION_CLEAR({ zoneId: "z1" }));

    const zone = os.getState().os.focus.zones["z1"];
    expect(getSelection("z1")).toEqual([]);
    expect(zone?.selectionAnchor).toBeNull();
  });
});
