/**
 * Zone Trigger API — T1 tests (updated for single-signature API)
 *
 * @spec docs/1-project/os-core/trigger-unify/notes/2026-0308-[plan]-trigger-unify.md
 *
 * Verifies zone.trigger() and zone.overlay() — the unified trigger declaration API.
 * zone.trigger(id, fn) always takes (focusId: string) => BaseCommand.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { describe, expect, it } from "vitest";

// ── Minimal app for testing zone-level trigger API ──────────────────

interface TestState {
  count: number;
  activeItem: string | null;
}

const INITIAL: TestState = { count: 0, activeItem: null };

describe("Feature: zone.trigger() API — single signature", () => {
  it("zone.trigger(id, fn) returns TriggerBinding shape", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const trigger = zone.trigger("do-increment", () => increment());

    expect(trigger).toHaveProperty("id", "do-increment");
    expect(trigger).toHaveProperty("onActivate");
    expect(typeof trigger.onActivate).toBe("function");
  });

  it("zone.trigger(id, fn) — cursor-dependent: wraps factory with focusId mapping", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const activate = zone.command<"ACTIVATE", { id: string }>(
      "ACTIVATE",
      (ctx, payload) => ({
        state: { ...ctx.state, activeItem: payload.id },
      }),
    );

    const trigger = zone.trigger("activate-item", (fid) => activate({ id: fid }));

    expect(trigger).toHaveProperty("id", "activate-item");
    expect(typeof trigger.onActivate).toBe("function");
    // Call the onActivate function to verify payload mapping
    const cmd = trigger.onActivate("item-1");
    expect(cmd).toHaveProperty("type", "ACTIVATE");
  });

  it("zone.trigger(id, fn) — static command: uses () => cmd pattern", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const cmd = increment();
    const trigger = zone.trigger("inc-btn", () => cmd);

    expect(trigger.id).toBe("inc-btn");
    // onActivate is always a function under the new API
    expect(typeof trigger.onActivate).toBe("function");
    expect(trigger.onActivate("")).toEqual(cmd);
  });
});

describe("Feature: zone.overlay() API", () => {
  it("zone.overlay(id, config) returns CompoundTriggerComponents", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");

    const dialog = zone.overlay("confirm-dialog", {
      role: "dialog",
    });

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

  it("zone.overlay(id, config) for menu role", () => {
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

describe("Feature: bind() with triggers array", () => {
  it("bind() accepts triggers array with TriggerBinding entries", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const incTrigger = zone.trigger("inc-btn", () => increment());

    const bound = zone.bind({
      role: "toolbar",
      triggers: [incTrigger],
    });

    expect(bound).toHaveProperty("Zone");
    expect(bound).toHaveProperty("Item");
  });
});
