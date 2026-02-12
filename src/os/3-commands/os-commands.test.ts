/**
 * L3. OS Commands — Integration Tests
 *
 * Tests the critical integration point: OS commands (SELECT, ACTIVATE, OS_DELETE,
 * OS_MOVE_UP/DOWN) resolving Zone callbacks from ZoneRegistry and dispatching
 * app commands via the kernel.
 *
 * This is where L4 (ZoneRegistry) + L5 (resolveFocusId) + L6 (App Commands)
 * converge. If these tests pass, the full CHECK → onCheck → ToggleTodo
 * pipeline is proven correct.
 */

import { todoSlice } from "@apps/todo/app";
// ── App Commands (for ZoneRegistry callbacks) ──
import {
  AddTodo,
  DeleteTodo,
  MoveItemDown,
  MoveItemUp,
  StartEdit,
  ToggleTodo,
} from "@apps/todo/features/commands/list";
import { selectVisibleTodos } from "@apps/todo/selectors";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { ACTIVATE } from "@os/3-commands/interaction/activate";
import { OS_CHECK } from "@os/3-commands/interaction/check";
import { OS_DELETE } from "@os/3-commands/interaction/delete";
import { OS_MOVE_DOWN, OS_MOVE_UP } from "@os/3-commands/interaction/move";
// ── OS Commands ──
import { SELECT } from "@os/3-commands/selection/select";
import { type AppState, kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

function getAppState(): import("@apps/todo/model/appState").AppState {
  return todoSlice.getState();
}

/**
 * Set up OS focus state: activeZoneId + focusedItemId.
 */
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

/**
 * Register a Zone in ZoneRegistry with given callbacks.
 */
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
  let now = 2000000000000;
  vi.spyOn(Date, "now").mockImplementation(() => ++now);
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
  it("dispatches ToggleTodo when Zone has onCheck with OS.FOCUS", () => {
    // Setup: add a todo and get its ID
    kernel.dispatch(AddTodo({ text: "Toggle test" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Toggle test",
    )!;
    expect(todo.completed).toBe(false);

    // Setup: focus state + ZoneRegistry
    setupFocus("listView", String(todo.id));
    registerZone("listView", {
      onCheck: ToggleTodo({ id: "OS.FOCUS" as any }),
    });

    // Act: dispatch CHECK (what Space key does on checkbox role)
    kernel.dispatch(OS_CHECK({ targetId: String(todo.id) }));

    // Assert: ToggleTodo should have been dispatched, toggling the item
    expect(getAppState().data.todos[todo.id]!.completed).toBe(true);
  });

  it("dispatches ToggleTodo twice toggles back", () => {
    kernel.dispatch(AddTodo({ text: "Double toggle" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Double toggle",
    )!;

    setupFocus("listView", String(todo.id));
    registerZone("listView", {
      onCheck: ToggleTodo({ id: "OS.FOCUS" as any }),
    });

    kernel.dispatch(OS_CHECK({ targetId: String(todo.id) }));
    expect(getAppState().data.todos[todo.id]!.completed).toBe(true);

    kernel.dispatch(OS_CHECK({ targetId: String(todo.id) }));
    expect(getAppState().data.todos[todo.id]!.completed).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SELECT — pure aria-selected (does NOT trigger app callbacks)
// ═══════════════════════════════════════════════════════════════════

describe("SELECT — pure selection (no app callbacks)", () => {
  it("does NOT dispatch onCheck when Zone has it registered", () => {
    kernel.dispatch(AddTodo({ text: "Select purity" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Select purity",
    )!;

    setupFocus("listView", String(todo.id));
    registerZone("listView", {
      onCheck: ToggleTodo({ id: "OS.FOCUS" as any }),
    });

    // Act: dispatch SELECT (not CHECK)
    kernel.dispatch(SELECT({ mode: "toggle" }));

    // Assert: ToggleTodo should NOT have been dispatched
    expect(getAppState().data.todos[todo.id]!.completed).toBe(false);
    // But OS selection should be applied
    const zone = kernel.getState().os.focus.zones["listView"];
    expect(zone?.selection).toContain(String(todo.id));
  });

  it("falls back to OS selection when no callbacks registered", () => {
    setupFocus("plainZone", "item-1");
    registerZone("plainZone", {}); // no callbacks

    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones["plainZone"];
    expect(zone?.selection).toContain("item-1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// ACTIVATE → onAction
// ═══════════════════════════════════════════════════════════════════

describe("ACTIVATE → onAction pipeline", () => {
  it("dispatches StartEdit when Zone has onAction", () => {
    kernel.dispatch(AddTodo({ text: "Edit me" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Edit me",
    )!;

    setupFocus("listView", String(todo.id));
    registerZone("listView", {
      onAction: StartEdit({ id: "OS.FOCUS" as any }),
    });

    kernel.dispatch(ACTIVATE());

    // StartEdit should set editingId
    expect(getAppState().ui.editingId).toBe(todo.id);
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_DELETE → onDelete
// ═══════════════════════════════════════════════════════════════════

describe("OS_DELETE → onDelete pipeline", () => {
  it("dispatches DeleteTodo when Zone has onDelete", () => {
    kernel.dispatch(AddTodo({ text: "Delete me" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Delete me",
    )!;

    setupFocus("listView", String(todo.id));
    registerZone("listView", {
      onDelete: DeleteTodo({ id: "OS.FOCUS" as any }),
    });

    kernel.dispatch(OS_DELETE());

    expect(getAppState().data.todos[todo.id]).toBeUndefined();
  });

  it("does nothing when Zone has no onDelete", () => {
    kernel.dispatch(AddTodo({ text: "Keep me" }));
    const todo = selectVisibleTodos(getAppState()).find(
      (t) => t.text === "Keep me",
    )!;

    setupFocus("listView", String(todo.id));
    registerZone("listView", {}); // no onDelete

    kernel.dispatch(OS_DELETE());

    expect(getAppState().data.todos[todo.id]).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_MOVE_UP / OS_MOVE_DOWN → onMoveUp / onMoveDown
// ═══════════════════════════════════════════════════════════════════

describe("OS_MOVE → onMoveUp/Down pipeline", () => {
  it("dispatches MoveItemUp when Zone has onMoveUp", () => {
    const id1 = addTodo("First");
    const id2 = addTodo("Second");

    const orderBefore = selectVisibleTodos(getAppState()).map((t) => t.id);
    expect(orderBefore.indexOf(id2)).toBeGreaterThan(orderBefore.indexOf(id1));

    setupFocus("listView", String(id2));
    registerZone("listView", {
      onMoveUp: MoveItemUp({ focusId: "OS.FOCUS" as any }),
    });

    kernel.dispatch(OS_MOVE_UP());

    const orderAfter = selectVisibleTodos(getAppState()).map((t) => t.id);
    expect(orderAfter.indexOf(id2)).toBeLessThan(orderAfter.indexOf(id1));
  });

  it("dispatches MoveItemDown when Zone has onMoveDown", () => {
    const id1 = addTodo("A");
    const id2 = addTodo("B");

    setupFocus("listView", String(id1));
    registerZone("listView", {
      onMoveDown: MoveItemDown({ focusId: "OS.FOCUS" as any }),
    });

    kernel.dispatch(OS_MOVE_DOWN());

    const orderAfter = selectVisibleTodos(getAppState()).map((t) => t.id);
    expect(orderAfter.indexOf(id1)).toBeGreaterThan(orderAfter.indexOf(id2));
  });
});

// ═══════════════════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════════════════

let idCounter = 0;
function addTodo(label: string): number {
  const text = `${label}_${++idCounter}`;
  kernel.dispatch(AddTodo({ text }));
  const todo = selectVisibleTodos(getAppState()).find((t) => t.text === text);
  if (!todo) throw new Error(`addTodo failed for "${text}"`);
  return todo.id;
}
