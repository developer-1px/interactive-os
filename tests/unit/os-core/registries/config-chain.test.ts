/**
 * @spec docs/1-project/command-config-invariant/spec.md
 *
 * T1: Config 타입 확장 — chain fallback fields + rolePresets values
 * 🔴 RED: all tests should FAIL until Phase 1 config extension is implemented.
 */

import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// 1. NavigateConfig chain fields exist in rolePresets
// ═══════════════════════════════════════════════════════════════════

describe("T1: NavigateConfig chain fields", () => {
  it("tree has onRight = ['expand', 'enterChild']", () => {
    const config = resolveRole("tree");
    expect((config.navigate as any).onRight).toEqual(["expand", "enterChild"]);
  });

  it("tree has onLeft = ['collapse', 'goParent']", () => {
    const config = resolveRole("tree");
    expect((config.navigate as any).onLeft).toEqual(["collapse", "goParent"]);
  });

  it("menu has onCrossAxis = ['expandSubmenu']", () => {
    const config = resolveRole("menu");
    expect((config.navigate as any).onCrossAxis).toEqual(["expandSubmenu"]);
  });

  it("menubar has onDown = ['expandSubmenu']", () => {
    const config = resolveRole("menubar");
    expect((config.navigate as any).onDown).toEqual(["expandSubmenu"]);
  });

  it("listbox has no chain fields (defaults)", () => {
    const config = resolveRole("listbox");
    expect((config.navigate as any).onRight).toBeUndefined();
    expect((config.navigate as any).onLeft).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Check/Action aria derivation — checkbox, switch, listbox
// ═══════════════════════════════════════════════════════════════════

describe("T1: SelectConfig aria field + inputmap", () => {
  it("checkbox has inputmap with OS_CHECK", () => {
    const config = resolveRole("checkbox");
    expect(config.select.mode).toBe("none");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("switch has inputmap with Space+Enter → OS_CHECK", () => {
    const config = resolveRole("switch");
    expect(config.select.mode).toBe("none");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("listbox has select.aria = 'selected' (default)", () => {
    const config = resolveRole("listbox");
    expect((config.select as any).aria).toBe("selected");
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. inputmap replaces action.commands / activate.effect
// ═══════════════════════════════════════════════════════════════════

describe("T1: inputmap replaces action.commands", () => {
  it("accordion has inputmap with OS_EXPAND", () => {
    const config = resolveRole("accordion");
    expect(config.inputmap["Space"]?.[0]?.type).toBe("OS_EXPAND");
  });

  it("menu has inputmap with [OS_ACTIVATE] (close delegated to onAction)", () => {
    const config = resolveRole("menu");
    expect(config.inputmap["Space"]?.[0]?.type).toBe("OS_ACTIVATE");
    expect(config.inputmap["Space"]?.[1]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. DismissConfig restoreFocus field
// ═══════════════════════════════════════════════════════════════════

describe("T1: DismissConfig restoreFocus field", () => {
  it("dialog has dismiss.restoreFocus = true", () => {
    const config = resolveRole("dialog");
    expect((config.dismiss as any).restoreFocus).toBe(true);
  });

  it("alertdialog has dismiss.restoreFocus = true", () => {
    const config = resolveRole("alertdialog");
    expect((config.dismiss as any).restoreFocus).toBe(true);
  });
});
