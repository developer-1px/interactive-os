/**
 * app-modules — Red tests for App Module System.
 *
 * Tests the AppModule interface and module composition:
 * - history() module replaces `history: true` config
 * - persistence() module replaces `persistence: {}` config
 * - deleteToast() module: destructive action → OS_NOTIFY with Undo
 * - Modules are installable/removable: array inclusion = ON, exclusion = OFF
 *
 * 🔴 RED: These tests define the target API. Implementation does not exist yet.
 */

import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Target API
// ═══════════════════════════════════════════════════════════════════

// T1: AppModule interface — type import for reference
import "@/os/app/modules/types";

import { produce } from "immer";
// The defineApp that accepts modules: AppModule[]
import { defineApp } from "@/os/app/defineApp";
import { createUndoRedoCommands } from "@/os/app/defineApp/undoRedo";
// T4: deleteToast module
import { deleteToast } from "@/os/app/modules/deleteToast";
// T2: history module
import { history } from "@/os/app/modules/history";
// T3: persistence module
import { persistence } from "@/os/app/modules/persistence";

// ═══════════════════════════════════════════════════════════════════
// Minimal test app state
// ═══════════════════════════════════════════════════════════════════

interface TestItem {
  id: string;
  text: string;
}

interface TestState {
  data: { items: TestItem[] };
  ui: Record<string, never>;
  history: { past: unknown[]; future: unknown[] };
}

const INITIAL: TestState = {
  data: {
    items: [
      { id: "a", text: "Alpha" },
      { id: "b", text: "Beta" },
      { id: "c", text: "Gamma" },
    ],
  },
  ui: {},
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// T1: AppModule interface contract
// ═══════════════════════════════════════════════════════════════════

describe("T1: AppModule interface", () => {
  it("history() returns an AppModule with id and install", () => {
    const mod = history();
    expect(mod).toHaveProperty("id");
    expect(mod).toHaveProperty("install");
    expect(typeof mod.id).toBe("string");
    expect(typeof mod.install).toBe("function");
  });

  it("persistence() returns an AppModule with id and install", () => {
    const mod = persistence({ key: "test-app" });
    expect(mod).toHaveProperty("id");
    expect(mod).toHaveProperty("install");
  });

  it("deleteToast() returns an AppModule with id and install", () => {
    const mod = deleteToast();
    expect(mod).toHaveProperty("id");
    expect(mod).toHaveProperty("install");
  });

  it("each module has a unique id", () => {
    const ids = [history().id, persistence({ key: "k" }).id, deleteToast().id];
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// T6: defineApp accepts modules array
// ═══════════════════════════════════════════════════════════════════

describe("T6: defineApp({ modules: [...] })", () => {
  it("accepts modules array instead of boolean config", () => {
    // This should NOT throw — the API accepts modules
    const App = defineApp<TestState>("test-modules", INITIAL, {
      modules: [history()],
    });
    expect(App).toBeDefined();
  });

  it("works with empty modules array", () => {
    const App = defineApp<TestState>("test-no-modules", INITIAL, {
      modules: [],
    });
    expect(App).toBeDefined();
  });

  it("works with multiple modules", () => {
    const App = defineApp<TestState>("test-multi", INITIAL, {
      modules: [history(), deleteToast()],
    });
    expect(App).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// T2: history() module — replaces `history: true`
// ═══════════════════════════════════════════════════════════════════

describe("T2: history() module", () => {
  it("enables undo/redo when installed", () => {
    const App = defineApp<TestState>("test-hist", INITIAL, {
      modules: [history()],
    });

    // Command must be registered BEFORE App.create()
    const removeItem = App.createZone("z").command(
      "removeItem",
      (ctx, payload: { id: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.data.items = draft.data.items.filter(
            (i) => i.id !== payload.id,
          );
        }),
      }),
    );

    const app = App.create({ history: true });

    app.dispatch(removeItem({ id: "a" }));
    expect(app.state.data.items).toHaveLength(2);

    // History should have recorded the action
    expect(app.state.history.past.length).toBeGreaterThan(0);
  });

  it("does NOT record history when module is not installed", () => {
    const App = defineApp<TestState>("test-no-hist", INITIAL, {
      modules: [], // No history module
    });

    const removeItem = App.createZone("z").command(
      "removeItem",
      (ctx, payload: { id: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.data.items = draft.data.items.filter(
            (i) => i.id !== payload.id,
          );
        }),
      }),
    );

    const app = App.create();

    app.dispatch(removeItem({ id: "a" }));
    // History should remain empty — module not installed
    expect(app.state.history.past).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// T4: deleteToast() module
// ═══════════════════════════════════════════════════════════════════

describe("T4: deleteToast() module", () => {
  it("shows undo toast after collection remove when installed", () => {
    const App = defineApp<TestState>("test-toast", INITIAL, {
      modules: [history(), deleteToast()],
    });

    // Command registered BEFORE App.create()
    const removeItem = App.createZone("z").command(
      "z:remove",
      (ctx, payload: { id: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.data.items = draft.data.items.filter(
            (i) => i.id !== payload.id,
          );
        }),
      }),
    );

    const app = App.create({ withOS: true, history: true });

    // Get OS toast stack
    const getToasts = () => {
      const fullState = app.runtime.getState();
      return (fullState as any).os?.notifications?.stack ?? [];
    };

    expect(getToasts()).toHaveLength(0);

    app.dispatch(removeItem({ id: "a" }));

    // Toast should have been emitted
    const toasts = getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].actionLabel).toBe("Undo");
    expect(toasts[0].actionCommand).toBeDefined();
  });

  it("does NOT show toast when deleteToast module is not installed", () => {
    const App = defineApp<TestState>("test-no-toast", INITIAL, {
      modules: [history()], // No deleteToast
    });

    const removeItem = App.createZone("z").command(
      "z:remove",
      (ctx, payload: { id: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.data.items = draft.data.items.filter(
            (i) => i.id !== payload.id,
          );
        }),
      }),
    );

    const app = App.create({ withOS: true, history: true });

    const getToasts = () => {
      const fullState = app.runtime.getState();
      return (fullState as any).os?.notifications?.stack ?? [];
    };

    app.dispatch(removeItem({ id: "a" }));

    // No toast — module not installed
    expect(getToasts()).toHaveLength(0);
  });

  it("toast actionCommand dispatches undo", () => {
    const App = defineApp<TestState>("test-toast-undo", INITIAL, {
      modules: [history(), deleteToast()],
    });

    const removeItem = App.createZone("z").command(
      "z:remove",
      (ctx, payload: { id: string }) => ({
        state: produce(ctx.state, (draft) => {
          draft.data.items = draft.data.items.filter(
            (i) => i.id !== payload.id,
          );
        }),
      }),
    );

    // Register undo/redo commands so the Undo action works
    const { undoCommand: _undo } = createUndoRedoCommands(App);

    const app = App.create({ withOS: true, history: true });

    app.dispatch(removeItem({ id: "a" }));
    expect(app.state.data.items).toHaveLength(2);

    // Get the toast's action command and dispatch it → should undo
    const toasts =
      (app.runtime.getState() as any).os?.notifications?.stack ?? [];
    const undoCmd = toasts[0]?.actionCommand;
    expect(undoCmd).toBeDefined();

    app.dispatch(undoCmd);
    expect(app.state.data.items).toHaveLength(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Feature Flag: module inclusion = ON, exclusion = OFF
// ═══════════════════════════════════════════════════════════════════

describe("Feature flag: install/uninstall symmetry", () => {
  it("removing a module from the array completely disables its behavior", () => {
    // Install deleteToast
    const AppWith = defineApp<TestState>("test-with", INITIAL, {
      modules: [history(), deleteToast()],
    });
    // Uninstall deleteToast (just remove from array)
    const AppWithout = defineApp<TestState>("test-without", INITIAL, {
      modules: [history()],
    });

    // Both should work, only behavior differs
    expect(AppWith).toBeDefined();
    expect(AppWithout).toBeDefined();
  });
});
