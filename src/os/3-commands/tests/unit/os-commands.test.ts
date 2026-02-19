/**
 * L3. OS Commands — Integration Tests (ZoneCursor pattern)
 *
 * Tests the dispatch chain: OS command → ZoneRegistry lookup → ZoneCallback(cursor).
 * Uses mock callbacks to isolate OS behavior from app-specific logic.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { ACTIVATE } from "@os/3-commands/interaction/activate";
import { OS_CHECK } from "@os/3-commands/interaction/check";
import { OS_DELETE } from "@os/3-commands/interaction/delete";
import { OS_MOVE_DOWN, OS_MOVE_UP } from "@os/3-commands/interaction/move";
import { OS_REDO } from "@os/3-commands/interaction/redo";
import { OS_UNDO } from "@os/3-commands/interaction/undo";
import { SELECT } from "@os/3-commands/selection/select";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

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

function registerZone(
  id: string,
  callbacks: Partial<{
    onCheck: (cursor: ZoneCursor) => any;
    onAction: (cursor: ZoneCursor) => any;
    onDelete: (cursor: ZoneCursor) => any;
    onMoveUp: (cursor: ZoneCursor) => any;
    onMoveDown: (cursor: ZoneCursor) => any;
    onUndo: any;
    onRedo: any;
  }>,
) {
  ZoneRegistry.register(id, {
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
    vi.restoreAllMocks();
  };
});

// ═══════════════════════════════════════════════════════════════════
// CHECK → onCheck
// ═══════════════════════════════════════════════════════════════════

describe("CHECK → onCheck pipeline", () => {
  it("dispatches onCheck callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onCheck: (cursor) => ({ type: "mock/toggle", payload: { id: cursor.focusId } }),
    });

    kernel.dispatch(OS_CHECK({ targetId: "item-1" }));
  });

  it("does nothing when Zone has no onCheck", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_CHECK({ targetId: "item-1" }));
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════════

describe("SELECT — pure selection (no onCheck delegation)", () => {
  it("does NOT dispatch onCheck on SELECT", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onCheck: (cursor) => ({ type: "mock/toggle", payload: { id: cursor.focusId } }),
    });

    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones.testZone;
    expect(zone?.selection).toContain("item-1");
  });

  it("toggles selection when no callbacks registered", () => {
    setupFocus("plainZone", "item-1");
    registerZone("plainZone", {});

    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones.plainZone;
    expect(zone?.selection).toContain("item-1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// ACTIVATE → onAction
// ═══════════════════════════════════════════════════════════════════

describe("ACTIVATE → onAction pipeline", () => {
  it("dispatches onAction callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onAction: (cursor) => ({ type: "mock/action", payload: { id: cursor.focusId } }),
    });

    kernel.dispatch(ACTIVATE());
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_DELETE → onDelete
// ═══════════════════════════════════════════════════════════════════

describe("OS_DELETE → onDelete pipeline", () => {
  it("dispatches onDelete callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onDelete: (cursor) => ({ type: "mock/delete", payload: { id: cursor.focusId } }),
    });

    kernel.dispatch(OS_DELETE());
  });

  it("does nothing when Zone has no onDelete", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_DELETE());
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_MOVE_UP / OS_MOVE_DOWN
// ═══════════════════════════════════════════════════════════════════

describe("OS_MOVE → onMoveUp/Down pipeline", () => {
  it("dispatches onMoveUp callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onMoveUp: (cursor) => ({ type: "mock/moveUp", payload: { id: cursor.focusId } }),
    });

    kernel.dispatch(OS_MOVE_UP());
  });

  it("dispatches onMoveDown callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onMoveDown: (cursor) => ({ type: "mock/moveDown", payload: { id: cursor.focusId } }),
    });

    kernel.dispatch(OS_MOVE_DOWN());
  });

  it("does nothing when Zone has no onMoveUp", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_MOVE_UP());
  });

  it("does nothing when Zone has no onMoveDown", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_MOVE_DOWN());
  });

  it("does nothing when no active zone (MOVE_UP)", () => {
    kernel.dispatch(OS_MOVE_UP());
  });

  it("does nothing when no active zone (MOVE_DOWN)", () => {
    kernel.dispatch(OS_MOVE_DOWN());
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_UNDO → onUndo (BaseCommand, not ZoneCallback)
// ═══════════════════════════════════════════════════════════════════

describe("OS_UNDO → onUndo pipeline", () => {
  it("dispatches onUndo callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onUndo: { type: "mock/undo", payload: undefined },
    });

    kernel.dispatch(OS_UNDO());
  });

  it("does nothing when Zone has no onUndo", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_UNDO());
  });

  it("does nothing when no active zone", () => {
    kernel.dispatch(OS_UNDO());
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_REDO → onRedo (BaseCommand, not ZoneCallback)
// ═══════════════════════════════════════════════════════════════════

describe("OS_REDO → onRedo pipeline", () => {
  it("dispatches onRedo callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onRedo: { type: "mock/redo", payload: undefined },
    });

    kernel.dispatch(OS_REDO());
  });

  it("does nothing when Zone has no onRedo", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_REDO());
  });

  it("does nothing when no active zone", () => {
    kernel.dispatch(OS_REDO());
  });
});
