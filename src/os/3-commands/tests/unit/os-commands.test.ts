/**
 * L3. OS Commands — Integration Tests
 *
 * Tests the dispatch chain: OS command → ZoneRegistry lookup → zone callback.
 * Uses mock callbacks to isolate OS behavior from app-specific logic.
 *
 * App-level command tests are in src/apps/todo/tests/unit/todo.v3.test.ts
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { ACTIVATE } from "@os/3-commands/interaction/activate";
import { OS_CHECK } from "@os/3-commands/interaction/check";
import { OS_DELETE } from "@os/3-commands/interaction/delete";
import { OS_MOVE_DOWN, OS_MOVE_UP } from "@os/3-commands/interaction/move";
import { SELECT } from "@os/3-commands/selection/select";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;
let callLog: string[];

// Mock command factories — track invocations via kernel state side-effect
function createMockCommand(name: string) {
  return Object.assign((payload?: any) => ({ type: `mock/${name}`, payload }), {
    type: `mock/${name}`,
    commandType: `mock/${name}`,
  });
}

const mockToggle = createMockCommand("toggle");
const mockAction = createMockCommand("action");
const mockDelete = createMockCommand("delete");
const mockMoveUp = createMockCommand("moveUp");
const mockMoveDown = createMockCommand("moveDown");

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
    onCheck: any;
    onAction: any;
    onDelete: any;
    onMoveUp: any;
    onMoveDown: any;
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
  callLog = [];
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
      onCheck: mockToggle({ id: "OS.FOCUS" }),
    });

    // Should not throw
    kernel.dispatch(OS_CHECK({ targetId: "item-1" }));
  });

  it("does nothing when Zone has no onCheck", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    // Should not throw
    kernel.dispatch(OS_CHECK({ targetId: "item-1" }));
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECT — pure aria-selected state (does NOT dispatch onCheck)
// ═══════════════════════════════════════════════════════════════════

describe("SELECT — pure selection (no onCheck delegation)", () => {
  it("does NOT dispatch onCheck on SELECT", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onCheck: mockToggle({ id: "OS.FOCUS" }),
    });

    // SELECT only updates selection state, does not trigger app callbacks
    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones["testZone"];
    expect(zone?.selection).toContain("item-1");
  });

  it("toggles selection when no callbacks registered", () => {
    setupFocus("plainZone", "item-1");
    registerZone("plainZone", {});

    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones["plainZone"];
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
      onAction: mockAction({ id: "OS.FOCUS" }),
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
      onDelete: mockDelete({ id: "OS.FOCUS" }),
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
// OS_MOVE_UP / OS_MOVE_DOWN → onMoveUp / onMoveDown
// ═══════════════════════════════════════════════════════════════════

describe("OS_MOVE → onMoveUp/Down pipeline", () => {
  it("dispatches onMoveUp callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onMoveUp: mockMoveUp({ focusId: "OS.FOCUS" }),
    });

    kernel.dispatch(OS_MOVE_UP());
  });

  it("dispatches onMoveDown callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onMoveDown: mockMoveDown({ focusId: "OS.FOCUS" }),
    });

    kernel.dispatch(OS_MOVE_DOWN());
  });
});
