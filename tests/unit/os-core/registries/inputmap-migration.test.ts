/**
 * inputmap migration — ActionConfig + ActivateConfig → inputmap
 *
 * @spec docs/1-project/action-axis-unification/notes/2026-0305-1400-plan-inputmap-migration.md
 *
 * Verifies:
 * 1. Role presets produce correct inputmap (Key → Command[])
 * 2. FocusGroupConfig no longer has action/activate fields
 *
 * T11/T12 (keyboard/click routing e2e) deleted — covered by APG tests
 * (checkbox.apg, accordion.apg, switch.apg)
 */

import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// T9: FocusGroupConfig shape — inputmap exists, action/activate removed
// ═══════════════════════════════════════════════════════════════════

describe("T9: FocusGroupConfig has inputmap, not action/activate", () => {
  it("resolveRole returns config with inputmap field", () => {
    const config = resolveRole("checkbox");
    expect(config).toHaveProperty("inputmap");
    expect(typeof config.inputmap).toBe("object");
  });

  it("resolveRole config does NOT have action field", () => {
    const config = resolveRole("checkbox") as Record<string, unknown>;
    expect(config).not.toHaveProperty("action");
  });

  it("resolveRole config does NOT have activate field", () => {
    const config = resolveRole("checkbox") as Record<string, unknown>;
    expect(config).not.toHaveProperty("activate");
  });
});

// ═══════════════════════════════════════════════════════════════════
// T10: Role preset inputmap — correct Key → Command[] mappings
// ═══════════════════════════════════════════════════════════════════

describe("T10: Role presets produce correct inputmap", () => {
  it("checkbox: Space → OS_CHECK, click → OS_CHECK", () => {
    const config = resolveRole("checkbox");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap["click"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    // Enter explicitly blocked for checkbox (APG: only Space toggles)
    expect(config.inputmap["Enter"]).toEqual([]);
  });

  it("switch: Space+Enter → OS_CHECK, click → OS_CHECK", () => {
    const config = resolveRole("switch");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap["click"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("accordion: Space+Enter → OS_EXPAND(toggle), click → OS_EXPAND(toggle)", () => {
    const config = resolveRole("accordion");
    const expandCmd = expect.objectContaining({ type: "OS_EXPAND" });
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expandCmd]),
    );
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([expandCmd]),
    );
    expect(config.inputmap["click"]).toEqual(
      expect.arrayContaining([expandCmd]),
    );
  });

  it("tree: Enter → OS_EXPAND(toggle), click → OS_EXPAND(toggle)", () => {
    const config = resolveRole("tree");
    const expandCmd = expect.objectContaining({ type: "OS_EXPAND" });
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([expandCmd]),
    );
    expect(config.inputmap["click"]).toEqual(
      expect.arrayContaining([expandCmd]),
    );
  });

  it("menu: Space+Enter → [OS_ACTIVATE, OS_OVERLAY_CLOSE], click → same", () => {
    const config = resolveRole("menu");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
    expect(config.inputmap["click"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
  });

  it("toolbar: Space+Enter → OS_ACTIVATE", () => {
    const config = resolveRole("toolbar");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
  });

  it("radiogroup: Space → OS_CHECK", () => {
    const config = resolveRole("radiogroup");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("listbox: inputmap is empty (no action keys, uses followFocus)", () => {
    const config = resolveRole("listbox");
    expect(config.inputmap).toEqual({});
  });

  it("tablist: inputmap is empty (uses followFocus for auto activation)", () => {
    const config = resolveRole("tablist");
    expect(config.inputmap).toEqual({});
  });

  it("dialog: inputmap is empty (no action commands)", () => {
    const config = resolveRole("dialog");
    expect(config.inputmap).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════
// T10 supplement: inputmap override via resolveRole
// ═══════════════════════════════════════════════════════════════════

describe("T10: inputmap override merging", () => {
  it("user can override inputmap entries on top of role preset", () => {
    const config = resolveRole("checkbox", {
      inputmap: { Enter: [{ type: "OS_CHECK" } as any] },
    });
    // Space should still be from preset
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    // Enter should be from override
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("user can add custom entries not in preset", () => {
    const config = resolveRole("listbox", {
      inputmap: {
        Space: [{ type: "OS_SELECT", payload: { mode: "toggle" } } as any],
      },
    });
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_SELECT" })]),
    );
  });
});
