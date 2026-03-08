/**
 * Zone Trigger API — T1 Red tests
 *
 * @spec docs/1-project/os-core/trigger-unify/notes/2026-0308-[plan]-trigger-unify.md
 *
 * Verifies zone.trigger() and zone.overlay() — the new unified trigger declaration API.
 * Architecture/refactoring task → Given-When-Then unit tests (no Decision Table).
 *
 * These tests should FAIL because the methods don't exist yet.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { describe, expect, it } from "vitest";

// ── Minimal app for testing zone-level trigger API ──────────────────

interface TestState {
  count: number;
  activeItem: string | null;
}

const INITIAL: TestState = { count: 0, activeItem: null };

describe("Feature: zone.trigger() API — Plan #1, #4", () => {
  it("zone.trigger(id, command) returns TriggerBinding shape", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    // zone.trigger() is the new API — should exist on ZoneHandle
    const trigger = zone.trigger("do-increment", increment());

    // Must have TriggerBinding shape
    expect(trigger).toHaveProperty("id", "do-increment");
    expect(trigger).toHaveProperty("onActivate");
    expect(trigger.onActivate).toEqual(increment());
  });

  it("zone.trigger(id, factory) detects function → cursor auto-bind", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const activate = zone.command<"ACTIVATE", { id: string }>(
      "ACTIVATE",
      (ctx, payload) => ({
        state: { ...ctx.state, activeItem: payload.id },
      }),
    );

    // Factory (function) → OS detects typeof, wraps with cursor auto-bind
    const trigger = zone.trigger("activate-item", activate);

    expect(trigger).toHaveProperty("id", "activate-item");
    // onActivate should be a function (factory), not a plain command object
    expect(typeof trigger.onActivate).toBe("function");
  });

  it("zone.trigger(id, command) — object command dispatched as-is", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    // Complete command (object with .type) → dispatch as-is, not wrapped
    const cmd = increment();
    const trigger = zone.trigger("inc-btn", cmd);

    expect(trigger.id).toBe("inc-btn");
    // onActivate is the command object itself (not a function)
    expect(typeof trigger.onActivate).not.toBe("function");
    expect(trigger.onActivate).toEqual(cmd);
  });
});

describe("Feature: zone.overlay() API — Plan #2, #5", () => {
  it("zone.overlay(id, config) returns CompoundTriggerComponents", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");

    const dialog = zone.overlay("confirm-dialog", {
      role: "dialog",
    });

    // Must return CompoundTriggerComponents shape
    expect(dialog).toHaveProperty("Root");
    expect(dialog).toHaveProperty("Trigger");
    expect(dialog).toHaveProperty("Portal");
    expect(dialog).toHaveProperty("Popover");
    expect(dialog).toHaveProperty("Content");
    expect(dialog).toHaveProperty("Dismiss");
    expect(dialog).toHaveProperty("Confirm");
  });

  it("zone.overlay(id, config) with confirm command", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const confirmDelete = zone.command("CONFIRM_DELETE", (ctx) => ({
      state: ctx.state,
    }));

    const dialog = zone.overlay("delete-dialog", {
      role: "alertdialog",
      confirm: confirmDelete(),
    });

    expect(dialog).toHaveProperty("Root");
    expect(dialog).toHaveProperty("Confirm");
  });

  it("zone.overlay(id, config) for popover role", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");

    const menu = zone.overlay("action-menu", {
      role: "menu",
    });

    expect(menu).toHaveProperty("Root");
    expect(menu).toHaveProperty("Trigger");
    expect(menu).toHaveProperty("Popover");
  });
});

describe("Feature: bind() with triggers Record — Plan #3", () => {
  it("bind() accepts triggers as Record<string, TriggerBinding>", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const incTrigger = zone.trigger("inc-btn", increment());

    // bind() should accept triggers as Record (not just array)
    const bound = zone.bind({
      role: "toolbar",
      triggers: {
        "inc-btn": incTrigger,
      } as any, // Record form — currently typed as TriggerBinding[]
    });

    expect(bound).toHaveProperty("Zone");
    expect(bound).toHaveProperty("Item");
  });
});
