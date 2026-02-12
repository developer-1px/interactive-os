/**
 * Clipboard OS Command Integration Test
 *
 * Tests the dispatch chain: OS_COPY → ZoneRegistry lookup → CopyTodo
 * and OS_PASTE → ZoneRegistry lookup → PasteTodo.
 *
 * /divide: Is the dispatch chain correct? → Unit test proves it.
 */

import { todoSlice } from "@apps/todo/app";
// App Commands
import {
  CopyTodo,
  CutTodo,
  PasteTodo,
} from "@apps/todo/features/commands/clipboard";
import { AddTodo } from "@apps/todo/features/commands/list";
import { selectVisibleTodos } from "@apps/todo/selectors";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
// OS Commands
import { OS_COPY, OS_CUT, OS_PASTE } from "@os/3-commands/clipboard/clipboard";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

function getAppState(): import("@apps/todo/model/appState").AppState {
  return todoSlice.getState();
}

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
  let now = 3000000000000;
  vi.spyOn(Date, "now").mockImplementation(() => ++now);

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

describe("OS_COPY → CopyTodo dispatch chain", () => {
  it("OS_COPY with onCopy callback dispatches CopyTodo", () => {
    // Setup: add a todo, register zone with onCopy, set focus
    kernel.dispatch(AddTodo({ text: "Copy Me" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Copy Me",
    )!;
    expect(todo).toBeDefined();

    const zoneId = "test-zone-clipboard";
    registerZoneWithClipboard(zoneId, {
      onCopy: CopyTodo({ id: "OS.FOCUS" as any }),
    });
    setupFocus(zoneId, String(todo.id));

    // Act: dispatch OS_COPY
    kernel.dispatch(OS_COPY());

    // Assert: state should be unchanged (Copy doesn't modify state)
    expect(getAppState().data.todos[todo.id]).toBeDefined();
    expect(getAppState().data.todos[todo.id]!.text).toBe("Copy Me");
  });

  it("OS_COPY without activeZoneId is no-op", () => {
    const beforeState = getAppState();
    kernel.dispatch(OS_COPY());
    expect(getAppState()).toBe(beforeState);
  });

  it("OS_COPY without onCopy callback is no-op", () => {
    const zoneId = "test-zone-no-copy";
    registerZoneWithClipboard(zoneId, {}); // No onCopy
    setupFocus(zoneId, "123");

    const beforeState = getAppState();
    kernel.dispatch(OS_COPY());
    // Should not crash
    expect(getAppState()).toBe(beforeState);
  });
});

describe("OS_CUT → CutTodo dispatch chain", () => {
  it("OS_CUT removes item from state", () => {
    kernel.dispatch(AddTodo({ text: "Cut Me" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Cut Me",
    )!;

    const zoneId = "test-zone-cut";
    registerZoneWithClipboard(zoneId, {
      onCut: CutTodo({ id: "OS.FOCUS" as any }),
    });
    setupFocus(zoneId, String(todo.id));

    kernel.dispatch(OS_CUT());

    // Assert: todo should be removed
    expect(getAppState().data.todos[todo.id]).toBeUndefined();
  });
});

describe("OS_COPY → OS_PASTE round-trip", () => {
  it("Copy then Paste duplicates the item", () => {
    kernel.dispatch(AddTodo({ text: "Round Trip" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Round Trip",
    )!;

    const zoneId = "test-zone-roundtrip";
    registerZoneWithClipboard(zoneId, {
      onCopy: CopyTodo({ id: "OS.FOCUS" as any }),
      onPaste: PasteTodo({ id: "OS.FOCUS" as any }),
    });
    setupFocus(zoneId, String(todo.id));

    const beforeCount = selectVisibleTodos(getAppState()).filter(
      (t) => t.text === "Round Trip",
    ).length;

    // Copy
    kernel.dispatch(OS_COPY());

    // Paste
    kernel.dispatch(OS_PASTE());

    const afterCount = selectVisibleTodos(getAppState()).filter(
      (t) => t.text === "Round Trip",
    ).length;

    // Should have one more copy
    expect(afterCount).toBe(beforeCount + 1);
  });
});
