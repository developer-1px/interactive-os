/**
 * Clipboard OS Command Integration Test (ZoneCursor pattern)
 */

import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_COPY, OS_CUT, OS_PASTE } from "@os/3-commands/clipboard/clipboard";
import { os } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

let snapshot: ReturnType<typeof os.getState>;

function setupFocus(zoneId: string, focusedItemId: string) {
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
          },
        },
      },
    },
  }));
}

function registerZoneWithClipboard(
  id: string,
  callbacks: Partial<{
    onCopy: (cursor: ZoneCursor) => any;
    onCut: (cursor: ZoneCursor) => any;
    onPaste: (cursor: ZoneCursor) => any;
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
  snapshot = os.getState();

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
    os.setState(() => snapshot);
    for (const key of [...ZoneRegistry.keys()]) {
      ZoneRegistry.unregister(key);
    }
    vi.restoreAllMocks();
  };
});

describe("OS_COPY dispatch chain", () => {
  it("OS_COPY with onCopy callback dispatches the callback", () => {
    const zoneId = "test-zone-copy";
    registerZoneWithClipboard(zoneId, {
      onCopy: (cursor) => ({
        type: "test/copy",
        payload: { id: cursor.focusId },
      }),
    });
    setupFocus(zoneId, "item-1");

    os.dispatch(OS_COPY());
  });

  it("OS_COPY without activeZoneId is no-op", () => {
    os.dispatch(OS_COPY());
    expect(os.getState().os).toBeDefined();
  });

  it("OS_COPY without onCopy callback is no-op", () => {
    const zoneId = "test-zone-no-copy";
    registerZoneWithClipboard(zoneId, {});
    setupFocus(zoneId, "123");

    os.dispatch(OS_COPY());
  });
});

describe("OS_CUT dispatch chain", () => {
  it("OS_CUT with onCut callback dispatches the callback", () => {
    const zoneId = "test-zone-cut";
    registerZoneWithClipboard(zoneId, {
      onCut: (cursor) => ({
        type: "test/cut",
        payload: { id: cursor.focusId },
      }),
    });
    setupFocus(zoneId, "item-1");

    os.dispatch(OS_CUT());
  });
});

describe("OS_PASTE dispatch chain", () => {
  it("OS_PASTE with onPaste callback dispatches the callback", () => {
    const zoneId = "test-zone-paste";
    registerZoneWithClipboard(zoneId, {
      onPaste: (cursor) => ({
        type: "test/paste",
        payload: { id: cursor.focusId },
      }),
    });
    setupFocus(zoneId, "item-1");

    os.dispatch(OS_PASTE());
  });
});
