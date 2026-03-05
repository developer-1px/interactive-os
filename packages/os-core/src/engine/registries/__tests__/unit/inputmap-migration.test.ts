/**
 * inputmap migration — ActionConfig + ActivateConfig → inputmap
 *
 * @spec docs/1-project/action-axis-unification/notes/2026-0305-1400-plan-inputmap-migration.md
 *
 * Verifies:
 * 1. Role presets produce correct inputmap (Key → Command[])
 * 2. FocusGroupConfig no longer has action/activate fields
 * 3. inputmap-based keyboard routing works end-to-end
 * 4. inputmap-based click routing works end-to-end
 */

import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { createOsPage } from "@os-devtool/testing/page";
import { afterEach, describe, expect, it } from "vitest";

const page = createOsPage();
afterEach(() => page.cleanup());

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
    expect(config.inputmap.Space).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap.click).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    // Enter should NOT be mapped for checkbox (APG: only Space)
    expect(config.inputmap.Enter).toBeUndefined();
  });

  it("switch: Space+Enter → OS_CHECK, click → OS_CHECK", () => {
    const config = resolveRole("switch");
    expect(config.inputmap.Space).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap.Enter).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap.click).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("accordion: Space+Enter → OS_EXPAND(toggle), click → OS_EXPAND(toggle)", () => {
    const config = resolveRole("accordion");
    const expandCmd = expect.objectContaining({ type: "OS_EXPAND" });
    expect(config.inputmap.Space).toEqual(expect.arrayContaining([expandCmd]));
    expect(config.inputmap.Enter).toEqual(expect.arrayContaining([expandCmd]));
    expect(config.inputmap.click).toEqual(expect.arrayContaining([expandCmd]));
  });

  it("tree: Enter → OS_EXPAND(toggle), click → OS_EXPAND(toggle)", () => {
    const config = resolveRole("tree");
    const expandCmd = expect.objectContaining({ type: "OS_EXPAND" });
    expect(config.inputmap.Enter).toEqual(expect.arrayContaining([expandCmd]));
    expect(config.inputmap.click).toEqual(expect.arrayContaining([expandCmd]));
  });

  it("menu: Space+Enter → [OS_ACTIVATE, OS_OVERLAY_CLOSE], click → same", () => {
    const config = resolveRole("menu");
    expect(config.inputmap.Space).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
    expect(config.inputmap.Enter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
    expect(config.inputmap.click).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
  });

  it("toolbar: Space+Enter → OS_ACTIVATE", () => {
    const config = resolveRole("toolbar");
    expect(config.inputmap.Space).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
    expect(config.inputmap.Enter).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "OS_ACTIVATE" }),
      ]),
    );
  });

  it("radiogroup: Space → OS_CHECK", () => {
    const config = resolveRole("radiogroup");
    expect(config.inputmap.Space).toEqual(
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
// T11: Keyboard routing via inputmap (end-to-end)
// ═══════════════════════════════════════════════════════════════════

describe("T11: inputmap keyboard routing", () => {
  it("checkbox: Space toggles aria-checked via inputmap", () => {
    page.goto("cb-zone", {
      items: ["cb-1"],
      role: "checkbox",
      focusedItemId: "cb-1",
    });

    expect(page.attrs("cb-1")["aria-checked"]).toBe(false);
    page.keyboard.press("Space");
    expect(page.attrs("cb-1")["aria-checked"]).toBe(true);
    page.keyboard.press("Space");
    expect(page.attrs("cb-1")["aria-checked"]).toBe(false);
  });

  it("accordion: Enter toggles aria-expanded via inputmap", () => {
    page.goto("acc-zone", {
      items: ["acc-1", "acc-2"],
      role: "accordion",
      focusedItemId: "acc-1",
    });

    expect(page.attrs("acc-1")["aria-expanded"]).toBe(false);
    page.keyboard.press("Enter");
    expect(page.attrs("acc-1")["aria-expanded"]).toBe(true);
  });

  it("switch: Enter toggles aria-checked via inputmap (Enter in inputmap)", () => {
    page.goto("sw-zone", {
      items: ["sw-1"],
      role: "switch",
      focusedItemId: "sw-1",
    });

    expect(page.attrs("sw-1")["aria-checked"]).toBe(false);
    page.keyboard.press("Enter");
    expect(page.attrs("sw-1")["aria-checked"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// T12: Click routing via inputmap
// ═══════════════════════════════════════════════════════════════════

describe("T12: inputmap click routing", () => {
  it("checkbox: click toggles aria-checked via inputmap['click']", () => {
    page.goto("cb-zone-2", {
      items: ["cb-2"],
      role: "checkbox",
      focusedItemId: "cb-2",
    });

    expect(page.attrs("cb-2")["aria-checked"]).toBe(false);
    page.click("cb-2");
    expect(page.attrs("cb-2")["aria-checked"]).toBe(true);
  });

  it("accordion: click toggles aria-expanded via inputmap['click']", () => {
    page.goto("acc-zone-2", {
      items: ["acc-3", "acc-4"],
      role: "accordion",
      focusedItemId: "acc-3",
    });

    expect(page.attrs("acc-3")["aria-expanded"]).toBe(false);
    page.click("acc-3");
    expect(page.attrs("acc-3")["aria-expanded"]).toBe(true);
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
    expect(config.inputmap.Space).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    // Enter should be from override
    expect(config.inputmap.Enter).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("user can add custom entries not in preset", () => {
    const config = resolveRole("listbox", {
      inputmap: {
        Space: [{ type: "OS_SELECT", payload: { mode: "toggle" } } as any],
      },
    });
    expect(config.inputmap.Space).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_SELECT" })]),
    );
  });
});
