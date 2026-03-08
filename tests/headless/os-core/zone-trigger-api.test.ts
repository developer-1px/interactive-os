/**
 * Zone Trigger API — T1 tests (updated for single-signature API)
 *
 * @spec docs/1-project/os-core/trigger-unify/notes/2026-0308-[plan]-trigger-unify.md
 *
 * Verifies bind({ triggers }) and zone.overlay() — the trigger declaration API.
 * Triggers are declared as object maps in bind(): { Name: (focusId: string) => BaseCommand }.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { describe, expect, it } from "vitest";

// ── Minimal app for testing zone-level trigger API ──────────────────

interface TestState {
  count: number;
  activeItem: string | null;
}

const INITIAL: TestState = { count: 0, activeItem: null };

describe("Feature: bind() with triggers object map", () => {
  it("bind() accepts triggers object and returns property getters", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const increment = zone.command("INCREMENT", (ctx) => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }));

    const UI = zone.bind({
      role: "toolbar",
      triggers: {
        DoIncrement: () => increment(),
      },
    });

    expect(UI).toHaveProperty("Zone");
    expect(UI).toHaveProperty("Item");
    expect(UI).toHaveProperty("triggers");
    expect(UI.triggers).toHaveProperty("DoIncrement");
    expect(typeof UI.triggers.DoIncrement).toBe("function");

    // The property getter should return the DOM attributes mapping
    const props = UI.triggers.DoIncrement();
    expect(props).toHaveProperty("data-trigger-id", "DoIncrement");
  });

  it("cursor-dependent triggers map focusId correctly via bind()", () => {
    const App = defineApp<TestState>("trigger-test", INITIAL);
    const zone = App.createZone("main");
    const activate = zone.command<"ACTIVATE", { id: string }>(
      "ACTIVATE",
      (ctx, payload) => ({
        state: { ...ctx.state, activeItem: payload.id },
      }),
    );

    const UI = zone.bind({
      role: "listbox",
      triggers: {
        ActivateItem: (fid: string) => activate({ id: fid }),
      },
    });

    // The internal TriggerBinding in ZoneRegistry gets correctly configured.
    // Testing the UI.triggers getter logic:
    const props = UI.triggers.ActivateItem("item-1");
    expect(props).toHaveProperty("data-trigger-id", "ActivateItem");
    expect(props).toHaveProperty("data-trigger-payload");
    expect(props["data-trigger-payload"]).toBe("item-1");
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

