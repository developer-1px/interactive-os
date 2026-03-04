/**
 * resolve-axis — Config-driven key ownership tests
 *
 * Verifies that action.commands[] drives Space/Enter → command mapping
 * WITHOUT role-specific if-branching.
 *
 * @spec docs/1-project/resolve-axis/BOARD.md
 *
 * Key principle: Command type IS the ARIA declaration.
 *   OS_CHECK  → aria-checked
 *   OS_PRESS  → aria-pressed
 *   OS_EXPAND → aria-expanded
 */
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { afterEach, describe, expect, it } from "vitest";

const page = createHeadlessPage();
afterEach(() => page.cleanup());

// ═══════════════════════════════════════════════════════════════════
// T1+T2: CheckConfig.keys / CheckConfig.onClick in role presets
// ═══════════════════════════════════════════════════════════════════

describe("CheckConfig.keys in role presets", () => {
    it("checkbox preset has keys: ['Space'] and onClick: true", () => {
        const config = resolveRole("checkbox");
        expect(config.check.keys).toEqual(["Space"]);
        expect(config.check.onClick).toBe(true);
    });

    it("switch preset has keys: ['Space', 'Enter'] and onClick: true", () => {
        const config = resolveRole("switch");
        expect(config.check.keys).toEqual(["Space", "Enter"]);
        expect(config.check.onClick).toBe(true);
    });

    it("radiogroup preset has keys: ['Space']", () => {
        const config = resolveRole("radiogroup");
        expect(config.check.keys).toEqual(["Space"]);
    });

    it("button preset has NO check.keys (mode is not 'check')", () => {
        const config = resolveRole("button");
        // button has check.mode = "none", so keys is irrelevant (default)
        expect(config.check.mode).toBe("none");
    });
});

// ═══════════════════════════════════════════════════════════════════
// T5: Toggle Button — aria-pressed via action.commands = [OS_PRESS()]
//
// Command type IS the ARIA declaration:
//   OS_PRESS → aria-pressed  (no check.aria config needed)
//   OS_CHECK → aria-checked
// ═══════════════════════════════════════════════════════════════════

describe("Toggle Button (aria-pressed) — action.commands=[OS_PRESS()]", () => {
    it("Space → toggles aria-pressed via OS_PRESS command", async () => {
        page.goto("tb-1", {
            role: "toolbar",
            items: ["bold"],
            focusedItemId: "bold",
            config: {
                action: {
                    commands: [{ type: "OS_PRESS" }],
                    // keys auto-derived: OS_PRESS → ["Space"]
                },
            },
        });

        await page.keyboard.press("Space");
        await page.locator("#bold").toHaveAttribute("aria-pressed", "true");

        await page.keyboard.press("Space");
        await page.locator("#bold").toHaveAttribute("aria-pressed", "false");
    });

    it("Enter → toggles aria-pressed via OS_PRESS command (explicit keys)", async () => {
        page.goto("tb-2", {
            role: "toolbar",
            items: ["italic"],
            focusedItemId: "italic",
            config: {
                action: {
                    commands: [{ type: "OS_PRESS" }],
                    keys: ["Space", "Enter"],
                },
            },
        });

        await page.keyboard.press("Enter");
        await page.locator("#italic").toHaveAttribute("aria-pressed", "true");
    });
});

// ═══════════════════════════════════════════════════════════════════
// Regression: existing patterns still work
// ═══════════════════════════════════════════════════════════════════

describe("Regression — existing check patterns", () => {
    it("checkbox: Space still toggles aria-checked", async () => {
        page.goto("reg-cb", {
            role: "checkbox",
            items: ["cb-a"],
            focusedItemId: "cb-a",
        });
        await page.keyboard.press("Space");
        await page.locator("#cb-a").toHaveAttribute("aria-checked", "true");
    });

    it("switch: Space still toggles aria-checked", async () => {
        page.goto("reg-sw", {
            role: "switch",
            items: ["sw-a"],
            focusedItemId: "sw-a",
        });
        await page.keyboard.press("Space");
        await page.locator("#sw-a").toHaveAttribute("aria-checked", "true");
    });

    it("switch: Enter still toggles aria-checked", async () => {
        page.goto("reg-sw2", {
            role: "switch",
            items: ["sw-b"],
            focusedItemId: "sw-b",
        });
        await page.keyboard.press("Enter");
        await page.locator("#sw-b").toHaveAttribute("aria-checked", "true");
    });
});
