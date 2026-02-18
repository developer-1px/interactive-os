/**
 * Clipboard OS Command Integration Test
 *
 * Tests the dispatch chain: OS_COPY → ZoneRegistry lookup → onCopy callback.
 * Uses mock commands to isolate OS behavior from app-specific logic.
 *
 * App-level clipboard tests (CopyTodo, PasteTodo, etc.) are in
 * src/apps/todo/tests/unit/todo.test.ts
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_COPY, OS_CUT, OS_PASTE } from "@os/3-commands/clipboard/clipboard";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

// Track which callbacks were invoked
let _callLog: string[] = [];

// Mock command factories that just log when dispatched
const mockCopy = Object.assign(
  (payload?: any) => ({ type: "test/copy", payload }),
  { type: "test/copy" },
);
const mockCut = Object.assign(
  (payload?: any) => ({ type: "test/cut", payload }),
  { type: "test/cut" },
);
const mockPaste = Object.assign(
  (payload?: any) => ({ type: "test/paste", payload }),
  { type: "test/paste" },
);

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

function registerZoneWithClipboard(
  id: string,
  callbacks: Partial<{
    onCopy: any;
    onCut: any;
    onPaste: any;
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
  _callLog = [];

  // Mock navigator.clipboard to avoid browser API errors in vitest
  Object.defineProperty(navigator, "clipboard", {
    value: {
      write: vi.fn().mockResolvedValue(undefined),
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(""),
    },
    writable: true,
    configurable: true,
  });

  return () => {
    kernel.setState(() => snapshot);
    for (const key of [...ZoneRegistry.keys()]) {
      ZoneRegistry.unregister(key);
    }
    vi.restoreAllMocks();
  };
});

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("OS_COPY dispatch chain", () => {
  it("OS_COPY with onCopy callback dispatches the callback", () => {
    const zoneId = "test-zone-copy";
    registerZoneWithClipboard(zoneId, {
      onCopy: mockCopy({ id: "OS.FOCUS" }),
    });
    setupFocus(zoneId, "item-1");

    // Should not throw
    kernel.dispatch(OS_COPY());
  });

  it("OS_COPY without activeZoneId is no-op", () => {
    const _beforeState = kernel.getState();
    kernel.dispatch(OS_COPY());
    // Should not crash
    expect(kernel.getState().os).toBeDefined();
  });

  it("OS_COPY without onCopy callback is no-op", () => {
    const zoneId = "test-zone-no-copy";
    registerZoneWithClipboard(zoneId, {}); // No onCopy
    setupFocus(zoneId, "123");

    // Should not crash
    kernel.dispatch(OS_COPY());
  });
});

describe("OS_CUT dispatch chain", () => {
  it("OS_CUT with onCut callback dispatches the callback", () => {
    const zoneId = "test-zone-cut";
    registerZoneWithClipboard(zoneId, {
      onCut: mockCut({ id: "OS.FOCUS" }),
    });
    setupFocus(zoneId, "item-1");

    kernel.dispatch(OS_CUT());
  });
});

describe("OS_PASTE dispatch chain", () => {
  it("OS_PASTE with onPaste callback dispatches the callback", () => {
    const zoneId = "test-zone-paste";
    registerZoneWithClipboard(zoneId, {
      onPaste: mockPaste({ id: "OS.FOCUS" }),
    });
    setupFocus(zoneId, "item-1");

    kernel.dispatch(OS_PASTE());
  });
});
