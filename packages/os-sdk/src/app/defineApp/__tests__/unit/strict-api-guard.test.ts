/**
 * @spec docs/1-project/os-core/strict-api-guard/notes/2026-0306-2100-plan-strict-api-guard.md
 *
 * T1: createSimpleTrigger / createDynamicTrigger without id → throw
 * T3: resolveRole with unknown role string → warn
 * T4: FieldRegistry.getValue for unregistered field → console.warn
 *
 * T5 deleted: required createOsPage + dispatch to reproduce invalid state
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

