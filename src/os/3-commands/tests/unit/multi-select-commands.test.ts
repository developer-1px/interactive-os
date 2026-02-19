/**
 * OS Multi-Select Commands — Unit Tests (ZoneCursor pattern)
 *
 * Tests that OS commands pass cursor with selection to callbacks,
 * and that callbacks receive full context for batch decisions.
 */

import { GLOBAL } from "@kernel";
import type { Command, ScopeToken } from "@kernel/core/tokens";
import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_COPY, OS_CUT } from "@os/3-commands/clipboard/clipboard";
import { OS_DELETE } from "@os/3-commands/interaction/delete";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

let snapshot: ReturnType<typeof kernel.getState>;

function setupFocusWithSelection(
  zoneId: string,
  focusedItemId: string,
  selection: string[],
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
            selection,
            selectionAnchor: selection[0] ?? null,
          },
        },
      },
    },
  }));
}

function captureDispatches() {
  const captured: Command[] = [];
  kernel.use({
    id: "test:capture-dispatches",
    scope: GLOBAL as ScopeToken,
    before(ctx) {
      captured.push({ ...ctx.command } as Command);
      return ctx;
    },
  });
  return captured;
}

beforeEach(() => {
  snapshot = kernel.getState();
  return () => {
    kernel.setState(() => snapshot);
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

    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onDelete,
    });
    setupFocusWithSelection("testZone", "item-3", [
      "item-1",
      "item-2",
      "item-3",
    ]);

    kernel.dispatch(OS_DELETE());

    // Callback called exactly ONCE with full cursor
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith({
      focusId: "item-3",
      selection: ["item-1", "item-2", "item-3"],
      anchor: "item-1",
    });
  });

  it("dispatches all commands returned by callback", () => {
    const captured = captureDispatches();

    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onDelete: (cursor: ZoneCursor) =>
        cursor.selection.map((id) => ({ type: "mock/delete", payload: { id } })),
    });
    setupFocusWithSelection("testZone", "item-3", [
      "item-1",
      "item-2",
      "item-3",
    ]);

    kernel.dispatch(OS_DELETE());

    const deleteCmds = captured.filter((cmd) => cmd.type === "mock/delete");
    expect(deleteCmds.length).toBe(3);
    expect(
      deleteCmds.map(
        (c: Record<string, unknown>) =>
          (c['payload'] as Record<string, unknown>)?.['id'],
      ),
    ).toEqual(expect.arrayContaining(["item-1", "item-2", "item-3"]));
  });

  it("falls back to single focusedItemId when no selection", () => {
    const onDelete = vi.fn((cursor: ZoneCursor) => ({
      type: "mock/delete",
      payload: { id: cursor.focusId },
    }));

    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onDelete,
    });
    setupFocusWithSelection("testZone", "item-1", []);

    kernel.dispatch(OS_DELETE());

    expect(onDelete).toHaveBeenCalledWith({
      focusId: "item-1",
      selection: [],
      anchor: null,
    });
  });

  it("clears selection after multi-delete", () => {
    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onDelete: () => ({ type: "mock/delete", payload: {} }),
    });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    kernel.dispatch(OS_DELETE());

    const zone = kernel.getState().os.focus.zones['testZone'];
    expect(zone?.selection).toEqual([]);
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

    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onCopy,
    });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    kernel.dispatch(OS_COPY());

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

    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onCut,
    });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    kernel.dispatch(OS_CUT());

    expect(onCut).toHaveBeenCalledTimes(1);
  });

  it("clears selection after multi-cut", () => {
    ZoneRegistry.register("testZone", {
      config: {} as any,
      element: document.createElement("div"),
      parentId: null,
      onCut: () => ({ type: "mock/cut", payload: {} }),
    });
    setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);

    kernel.dispatch(OS_CUT());

    const zone = kernel.getState().os.focus.zones['testZone'];
    expect(zone?.selection).toEqual([]);
  });
});
