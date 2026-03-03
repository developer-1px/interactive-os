/**
 * @spec docs/1-project/command-config-invariant/spec.md §1.5 (T5)
 *
 * T5: EXPAND → NAVIGATE 흡수
 * Input-based tests — keyboard.press("Enter") triggers the full pipeline:
 *   key → resolveKeyboard → OS_ACTIVATE → config.activate.effect → OS_EXPAND
 */
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { describe, it, expect, afterEach } from "vitest";

describe("T5: EXPAND → NAVIGATE (input-based)", () => {
    const page = createHeadlessPage();
    afterEach(() => page.cleanup());

    it("accordion has activate.effect = 'toggleExpand'", () => {
        const config = resolveRole("accordion");
        expect(config.activate.effect).toBe("toggleExpand");
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
