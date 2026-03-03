/**
 * @spec docs/1-project/command-config-invariant/spec.md
 *
 * T1: Config 타입 확장 — chain fallback fields + rolePresets values
 * 🔴 RED: all tests should FAIL until Phase 1 config extension is implemented.
 */
import { describe, it, expect } from "vitest";
import { resolveRole } from "../../roleRegistry.ts";

// ═══════════════════════════════════════════════════════════════════
// 1. NavigateConfig chain fields exist in rolePresets
// ═══════════════════════════════════════════════════════════════════

describe("T1: NavigateConfig chain fields", () => {
    it("tree has onRight = ['expand', 'enterChild']", () => {
        const config = resolveRole("tree");
        expect((config.navigate as any).onRight).toEqual([
            "expand",
            "enterChild",
        ]);
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
// 2. SelectConfig aria field
// ═══════════════════════════════════════════════════════════════════

describe("T1: SelectConfig aria field", () => {
    it("checkbox has select.aria = 'checked'", () => {
        const config = resolveRole("checkbox");
        expect((config.select as any).aria).toBe("checked");
    });

    it("switch has select.aria = 'checked'", () => {
        const config = resolveRole("switch");
        expect((config.select as any).aria).toBe("checked");
    });

    it("listbox has select.aria = 'selected' (default)", () => {
        const config = resolveRole("listbox");
        expect((config.select as any).aria).toBe("selected");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. ActivateConfig effect field
// ═══════════════════════════════════════════════════════════════════

describe("T1: ActivateConfig effect field", () => {
    it("accordion has activate.effect = 'toggleExpand'", () => {
        const config = resolveRole("accordion");
        expect((config.activate as any).effect).toBe("toggleExpand");
    });

    it("menu has activate.effect = 'invokeAndClose'", () => {
        const config = resolveRole("menu");
        expect((config.activate as any).effect).toBe("invokeAndClose");
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
