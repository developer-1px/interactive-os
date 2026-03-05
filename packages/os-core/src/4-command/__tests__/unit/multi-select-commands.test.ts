/**
 * OS Multi-Select Commands — Unit Tests (ZoneCursor pattern)
 *
 * Tests that OS commands pass cursor with selection to callbacks,
 * and that callbacks receive full context for batch decisions.
 */

import { GLOBAL } from "@kernel";
import type { Command, ScopeToken } from "@kernel/core/tokens";
import { OS_COPY, OS_CUT } from "@os-core/4-command/clipboard/clipboard";
import { OS_DELETE } from "@os-core/4-command/crud/delete";
import { os } from "@os-core/engine/kernel";
import type { ZoneCursor } from "@os-core/engine/registries/zoneRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { initialZoneState } from "@os-core/schema/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function setupFocusWithSelection(
  zoneId: string,
  focusedItemId: string,
  selection: string[],
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
            focusedItemId,
            items: buildSelectedItems(selection),
            selectionAnchor: selection[0] ?? null,
          },
        },
      },
    },
  }));
}

function captureDispatches() {
  const captured: Command[] = [];
  os.use({
    id: "test:capture-dispatches",
    scope: GLOBAL as ScopeToken,
    before(ctx) {
      captured.push({ ...ctx.command } as Command);
      return ctx;
    },
  });
  return captured;
}

const BASE_ZONE = {
  config: {} as any,
  element: document.createElement("div"),
  parentId: null,
  getItems: () => ["item-1", "item-2", "item-3", "item-4"],
};

beforeEach(() => {
  snapshot = os.getState();
  return () => {
    os.setState(() => snapshot);
    for (const key of [...ZoneRegistry.keys()]) {
      ZoneRegistry.unregister(key);
    }
    vi.restoreAllMocks();
  };
});

// ═══════════════════════════════════════════════════════════════════
// OS_DELETE with multi-selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_DELETE with multi-selection", () => {
  it("passes cursor with full selection to onDelete (ONE call)", () => {
    const onDelete = vi.fn((cursor: ZoneCursor) =>
      cursor.selection.map((id) => ({ type: "mock/delete", payload: { id } })),
    );

    ZoneRegistry.register("testZone", { ...BASE_ZONE, onDelete });
    setupFocusWithSelection("testZone", "item-3", [
      "item-1",
      "item-2",
      "item-3",
    ]);

    os.dispatch(OS_DELETE());

    // Callback called exactly ONCE with full cursor
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        focusId: "item-3",
        selection: ["item-1", "item-2", "item-3"],
        anchor: "item-1",
      }),
    );
  });

  it("dispatches all commands returned by callback", () => {
    const captured = captureDispatches();

    ZoneRegistry.register("testZone", {
      ...BASE_ZONE,
      onDelete: (cursor: ZoneCursor) =>
        cursor.selection.map((id) => ({
          type: "mock/delete",
          payload: { id },
        })),
    });
    setupFocusWithSelection("testZone", "item-3", [
      "item-1",
      "item-2",
      "item-3",
    ]);

    os.dispatch(OS_DELETE());

    const deleteCmds = captured.filter((cmd) => cmd.type === "mock/delete");
    expect(deleteCmds.length).toBe(3);
    expect(
      deleteCmds.map(
        (c: Record<string, unknown>) =>
          (c["payload"] as Record<string, unknown>)?.["id"],
      ),
    ).toEqual(expect.arrayContaining(["item-1", "item-2", "item-3"]));
  });

  it("falls back to single focusedItemId when no selection", () => {
    const onDelete = vi.fn((cursor: ZoneCursor) => ({
      type: "mock/delete",
      payload: { id: cursor.focusId },
    }));

    ZoneRegistry.register("testZone", { ...BASE_ZONE, onDelete });
    setupFocusWithSelection("testZone", "item-1", []);

    os.dispatch(OS_DELETE());

    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        focusId: "item-1",
        selection: [],
        anchor: null,
      }),
    );
  });

  it("preserves selection after multi-delete — app decides when to clear", () => {
    // OS_DELETE delegates to onDelete callback — selection clearing is app's responsibility.
    // This allows dialog-based deletion to preserve selection until user confirms.
    ZoneRegistry.register("testZone", {
      ...BASE_ZONE,
      onDelete: () => ({ type: "mock/delete", payload: {} }),
    });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    os.dispatch(OS_DELETE());

    expect(getSelection("testZone")).toEqual(["item-1", "item-2"]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_COPY with multi-selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_COPY with multi-selection", () => {
  it("passes cursor with selection to onCopy (ONE call)", () => {
    const onCopy = vi.fn((cursor: ZoneCursor) => ({
      type: "mock/copy",
      payload: { ids: cursor.selection },
    }));

    ZoneRegistry.register("testZone", { ...BASE_ZONE, onCopy });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    os.dispatch(OS_COPY());

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_CUT with multi-selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_CUT with multi-selection", () => {
  it("passes cursor with selection to onCut (ONE call)", () => {
    const onCut = vi.fn((cursor: ZoneCursor) => ({
      type: "mock/cut",
      payload: { ids: cursor.selection },
    }));

    ZoneRegistry.register("testZone", { ...BASE_ZONE, onCut });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    os.dispatch(OS_CUT());

    expect(onCut).toHaveBeenCalledTimes(1);
  });

  it("clears selection after multi-cut", () => {
    ZoneRegistry.register("testZone", {
      ...BASE_ZONE,
      onCut: () => ({ type: "mock/cut", payload: {} }),
    });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    os.dispatch(OS_CUT());

    expect(getSelection("testZone")).toEqual([]);
  });
});
