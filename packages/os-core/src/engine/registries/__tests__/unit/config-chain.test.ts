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
// 2. Check/Action aria derivation — checkbox, switch, listbox
// ═══════════════════════════════════════════════════════════════════

describe("T1: SelectConfig aria field", () => {
    it("checkbox has action.commands=[OS_CHECK()]", () => {
        const config = resolveRole("checkbox");
        expect(config.select.mode).toBe("none");
        expect(config.action.commands.some((c: any) => c.type === "OS_CHECK")).toBe(true);
    });

    it("switch has action.keys=['Space','Enter'] and OS_CHECK command", () => {
        const config = resolveRole("switch");
        expect(config.select.mode).toBe("none");
        expect(config.action.keys).toEqual(["Space", "Enter"]);
        expect(config.action.commands.some((c: any) => c.type === "OS_CHECK")).toBe(true);
    });

    it("listbox has select.aria = 'selected' (default)", () => {
        const config = resolveRole("listbox");
        expect((config.select as any).aria).toBe("selected");
    });
});


// ═══════════════════════════════════════════════════════════════════
// 3. ActivateConfig effect field / action config (v10)
// ═══════════════════════════════════════════════════════════════════

describe("T1: action.commands replaces activate.effect", () => {
    it("accordion has action.commands = [OS_EXPAND]", () => {
        const config = resolveRole("accordion");
        expect((config.action as any).commands[0]?.type).toBe("OS_EXPAND");
    });

    it("menu has action.commands = [OS_ACTIVATE, OS_OVERLAY_CLOSE]", () => {
        const config = resolveRole("menu");
        expect((config.action as any).commands[0]?.type).toBe("OS_ACTIVATE");
        expect((config.action as any).commands[1]?.type).toBe("OS_OVERLAY_CLOSE");
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
