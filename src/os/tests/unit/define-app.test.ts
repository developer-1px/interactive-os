/**
 * defineApp — Unit Tests
 *
 * Tests the mechanical behavior of the defineApp factory:
 * - condition: creation, uniqueness, evaluation
 * - selector: creation, uniqueness, selection
 * - command: registration, dispatch, when guard
 * - createZone: nested zone, command scoping
 * - create (testInstance): dispatch, when guard, reset, transaction
 */

import { defineApp } from "@os/defineApp";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Test State
// ═══════════════════════════════════════════════════════════════════

interface TestState {
  count: number;
  items: string[];
  history: {
    past: { command: any; timestamp: number; snapshot: any }[];
    future: { command: any; timestamp: number; snapshot: any }[];
  };
}

const INITIAL: TestState = {
  count: 0,
  items: [],
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// Condition
// ═══════════════════════════════════════════════════════════════════

describe("defineApp.condition", () => {
  it("creates a named condition with evaluate()", () => {
    const App = defineApp<TestState>("test-cond", INITIAL);
    const hasItems = App.condition("hasItems", (s) => s.items.length > 0);

    expect(hasItems.name).toBe("hasItems");
    expect(typeof hasItems.evaluate).toBe("function");
  });

  it("throws on duplicate condition name", () => {
    const App = defineApp<TestState>("test-cond-dup", INITIAL);
    App.condition("unique", (s) => s.count > 0);

    expect(() => App.condition("unique", (s) => s.count < 0)).toThrow(
      /already defined/,
    );
  });

  it("evaluates correctly via testInstance", () => {
    const App = defineApp<TestState>("test-cond-eval", INITIAL);
    const hasItems = App.condition("hasItems", (s) => s.items.length > 0);

    // Command must be registered BEFORE create() — testInstance snapshots the registry
    const addItem = App.command(
      "ADD_ITEM",
      (ctx, payload: { item: string }) => ({
        state: { ...ctx.state, items: [...ctx.state.items, payload.item] },
      }),
    );

    const app = App.create();
    expect(app.evaluate(hasItems)).toBe(false);

    app.dispatch(addItem({ item: "hello" }));
    expect(app.evaluate(hasItems)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Selector
// ═══════════════════════════════════════════════════════════════════

describe("defineApp.selector", () => {
  it("creates a named selector with select()", () => {
    const App = defineApp<TestState>("test-sel", INITIAL);
    const itemCount = App.selector("itemCount", (s) => s.items.length);

    expect(itemCount.name).toBe("itemCount");
    expect(typeof itemCount.select).toBe("function");
  });

  it("throws on duplicate selector name", () => {
    const App = defineApp<TestState>("test-sel-dup", INITIAL);
    App.selector("count", (s) => s.count);

    expect(() => App.selector("count", (s) => s.count)).toThrow(
      /already defined/,
    );
  });

  it("selects correctly via testInstance", () => {
    const App = defineApp<TestState>("test-sel-eval", INITIAL);
    const itemCount = App.selector("itemCount", (s) => s.items.length);

    const app = App.create();
    expect(app.select(itemCount)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Command
// ═══════════════════════════════════════════════════════════════════

describe("defineApp.command", () => {
  it("registers and dispatches a command", () => {
    const App = defineApp<TestState>("test-cmd", INITIAL);
    const increment = App.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const app = App.create();
    expect(app.state.count).toBe(0);

    app.dispatch(increment());
    expect(app.state.count).toBe(1);
  });

  it("passes payload to handler", () => {
    const App = defineApp<TestState>("test-cmd-payload", INITIAL);
    const addItem = App.command("ADD", (ctx, payload: { item: string }) => ({
      state: { ...ctx.state, items: [...ctx.state.items, payload.item] },
    }));

    const app = App.create();
    app.dispatch(addItem({ item: "first" }));
    app.dispatch(addItem({ item: "second" }));
    expect(app.state.items).toEqual(["first", "second"]);
  });

  it("respects when guard", () => {
    const App = defineApp<TestState>("test-cmd-when", INITIAL);
    const canDecrement = App.condition("canDecrement", (s) => s.count > 0);
    const decrement = App.command(
      "DECREMENT",
      (ctx) => ({
        state: { ...ctx.state, count: ctx.state.count - 1 },
      }),
      { when: canDecrement },
    );

    const app = App.create();
    expect(app.state.count).toBe(0);

    // Should be blocked by when guard
    const result = app.dispatch(decrement());
    expect(result).toBe(false);
    expect(app.state.count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// createZone
// ═══════════════════════════════════════════════════════════════════

describe("defineApp.createZone", () => {
  it("creates zone with own command namespace", () => {
    const App = defineApp<TestState>("test-zone", INITIAL);
    const zone = App.createZone("list");
    const addItem = zone.command(
      "ZONE_ADD",
      (ctx, payload: { item: string }) => ({
        state: { ...ctx.state, items: [...ctx.state.items, payload.item] },
      }),
    );

    const app = App.create();
    app.dispatch(addItem({ item: "from-zone" }));
    expect(app.state.items).toContain("from-zone");
  });

  it("supports nested zones", () => {
    const App = defineApp<TestState>("test-nested", INITIAL);
    const parent = App.createZone("parent");
    const child = parent.createZone("child");
    const childCmd = child.command("CHILD_CMD", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 10 },
    }));

    const app = App.create();
    app.dispatch(childCmd());
    expect(app.state.count).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TestInstance
// ═══════════════════════════════════════════════════════════════════

describe("defineApp.create (TestInstance)", () => {
  it("provides current state", () => {
    const App = defineApp<TestState>("test-inst", INITIAL);
    const app = App.create();
    expect(app.state.count).toBe(0);
    expect(app.state.items).toEqual([]);
  });

  it("resets to initial state", () => {
    const App = defineApp<TestState>("test-inst-reset", INITIAL);
    const increment = App.command("INC", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const app = App.create();
    app.dispatch(increment());
    expect(app.state.count).toBe(1);

    app.reset();
    expect(app.state.count).toBe(0);
  });

  it("accepts state overrides", () => {
    const App = defineApp<TestState>("test-inst-override", INITIAL);
    const app = App.create({ count: 42 });
    expect(app.state.count).toBe(42);
  });

  it("evaluates conditions", () => {
    const App = defineApp<TestState>("test-inst-cond", INITIAL);
    const isEmpty = App.condition("isEmpty", (s) => s.items.length === 0);
    const app = App.create();
    expect(app.evaluate(isEmpty)).toBe(true);
  });

  it("selects data", () => {
    const App = defineApp<TestState>("test-inst-sel", INITIAL);
    const count = App.selector("count", (s) => s.count);
    const app = App.create({ count: 7 });
    expect(app.select(count)).toBe(7);
  });
});
