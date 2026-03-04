/**
 * @spec docs/1-project/action-axis-unification/BOARD.md
 *
 * T5+: Accordion expand via action config (v10 declarative)
 * Input-based tests — keyboard.press("Enter"/"Space") triggers the full pipeline:
 *   key → resolveKeyboard → action config → OS_EXPAND (direct)
 *
 * v10: activate.effect path removed. OS_EXPAND is dispatched directly via action axis.
 */
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { describe, it, expect, afterEach } from "vitest";

describe("T5: EXPAND → NAVIGATE (input-based)", () => {
    const page = createHeadlessPage();
    afterEach(() => page.cleanup());

    it("accordion has action.commands = [OS_EXPAND] (v10 declarative)", () => {
        const config = resolveRole("accordion");
        // v10: action axis replaces activate.effect
        expect(config.action.commands[0]?.type).toBe("OS_EXPAND");
        // Legacy effect field may still exist but is no longer the source of truth
    });

    it("Enter on collapsed accordion → expands", async () => {
        page.goto("acc-zone", {
            role: "accordion",
            items: ["header-1", "header-2"],
            focusedItemId: "header-1",
        });

        await page.keyboard.press("Enter");
        await page.locator("#header-1").toHaveAttribute("aria-expanded", "true");
    });

    it("Enter on expanded accordion → collapses", async () => {
        page.goto("acc-zone", {
            role: "accordion",
            items: ["header-1", "header-2"],
            focusedItemId: "header-1",
            initial: { expanded: ["header-1"] },
        });

        await page.locator("#header-1").toHaveAttribute("aria-expanded", "true");
        await page.keyboard.press("Enter");
        await page.locator("#header-1").toHaveAttribute("aria-expanded", "false");
    });

    it("Space on accordion → also toggles expansion", async () => {
        page.goto("acc-zone", {
            role: "accordion",
            items: ["header-1", "header-2"],
            focusedItemId: "header-1",
        });

        await page.keyboard.press("Space");
        await page.locator("#header-1").toHaveAttribute("aria-expanded", "true");
    });
});
