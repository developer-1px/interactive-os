/**
 * @spec docs/1-project/os-core/strict-api-guard/notes/2026-0306-2100-plan-strict-api-guard.md
 *
 * T1: createSimpleTrigger / createDynamicTrigger without id → throw
 * T3: resolveRole with unknown role string → warn
 * T4: FieldRegistry.getValue for unregistered field → console.warn
 * T5: OS_ACTIVATE with item callback but no matching zone item → console.warn
 */
import { describe, expect, it, vi } from "vitest";

// ── T1: Trigger without id ──────────────────────────────────────────

describe("T1: createTrigger without id throws", () => {
  it("createSimpleTrigger without id option throws", async () => {
    const { createSimpleTrigger } = await import("../../trigger");
    const fakeCommand = { type: "FAKE_CMD" } as any;

    expect(() => createSimpleTrigger("test-app", fakeCommand)).toThrow(
      /onActivate requires an id/,
    );
  });

  it("createSimpleTrigger with id option does not throw", async () => {
    const { createSimpleTrigger } = await import("../../trigger");
    const fakeCommand = { type: "FAKE_CMD" } as any;

    expect(() =>
      createSimpleTrigger("test-app", fakeCommand, { id: "my-trigger" }),
    ).not.toThrow();
  });

  it("createDynamicTrigger without id option throws", async () => {
    const { createDynamicTrigger } = await import("../../trigger");
    const fakeFactory = (() => ({ type: "FAKE_CMD" })) as any;

    expect(() => createDynamicTrigger("test-app", fakeFactory)).toThrow(
      /onActivate requires an id/,
    );
  });

  it("createDynamicTrigger with id option does not throw", async () => {
    const { createDynamicTrigger } = await import("../../trigger");
    const fakeFactory = (() => ({ type: "FAKE_CMD" })) as any;

    expect(() =>
      createDynamicTrigger("test-app", fakeFactory, { id: "my-trigger" }),
    ).not.toThrow();
  });
});

// ── T3: Unknown role string ─────────────────────────────────────────

describe("T3: resolveRole with unknown role warns", () => {
  it("warns for unrecognized role string", async () => {
    const { resolveRole } = await import(
      "@os-core/engine/registries/roleRegistry"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    resolveRole("invalid-role-xyz");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown role"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn for valid role", async () => {
    const { resolveRole } = await import(
      "@os-core/engine/registries/roleRegistry"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    resolveRole("listbox");

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not warn for undefined role", async () => {
    const { resolveRole } = await import(
      "@os-core/engine/registries/roleRegistry"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    resolveRole(undefined);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ── T4: Field getValue unregistered warning ─────────────────────────

describe("T4: FieldRegistry.getValue warns for unregistered field", () => {
  it("warns when accessing unregistered field", async () => {
    const { FieldRegistry } = await import(
      "@os-core/engine/registries/fieldRegistry"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    FieldRegistry.getValue("nonexistent-field-xyz");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent-field-xyz"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn for registered field", async () => {
    const { FieldRegistry } = await import(
      "@os-core/engine/registries/fieldRegistry"
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    FieldRegistry.register("registered-field", { name: "registered-field" });
    FieldRegistry.getValue("registered-field");

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();

    // cleanup
    FieldRegistry.unregister("registered-field");
  });
});

// ── T5: OS_ACTIVATE with orphan item callback ──────────────────────

describe("T5: OS_ACTIVATE warns for orphan trigger callback", () => {
  it("warns when item callback exists but item is not in zone items", async () => {
    const { createOsPage } = await import("@os-devtool/testing/page");
    const { ZoneRegistry } = await import(
      "@os-core/engine/registries/zoneRegistry"
    );
    const { OS_FOCUS } = await import("@os-core/4-command/focus/focus");

    const page = createOsPage();
    const zoneId = "t5-zone";
    const items = ["item-a", "item-b"];

    page.goto(zoneId, { items, role: "listbox" });

    // Inject getItems so activate.ts can verify item membership
    ZoneRegistry.get(zoneId)!.getItems = () => items;

    // Register callback for an item NOT in the zone's items list
    ZoneRegistry.setItemCallback(zoneId, "ghost-item", {
      onActivate: { type: "GHOST_CMD" } as any,
    });

    // Force focus to ghost-item via OS_FOCUS (click bypasses OS_ACTIVATE)
    page.dispatch(OS_FOCUS({ zoneId, itemId: "ghost-item" }));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Enter triggers OS_ACTIVATE which checks zone item membership
    page.keyboard.press("Enter");

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("ghost-item"));
    warnSpy.mockRestore();
  });
});
