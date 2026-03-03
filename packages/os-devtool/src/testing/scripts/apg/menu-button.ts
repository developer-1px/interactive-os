/**
 * APG Menu Button — Spec-Driven TestBot Script
 *
 * Ground Truth: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
 *
 * Every assertion below maps 1:1 to the W3C APG keyboard interaction table.
 * This is NOT reverse-engineered from implementation — it's derived from spec.
 */

import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgMenuButtonScript: TestScript = {
  name: "APG Menu Button — Click + Keyboard + ARIA",
  group: "APG",
  async run(page, expect = defaultExpect) {
    // Navigate to the Menu Button pattern tab
    await page.locator("#tab-menu-button").click();

    const trigger = page.locator("#mb-actions-trigger");
    const firstItem = page.locator("#action-cut");
    const secondItem = page.locator("#action-copy");
    const lastItem = page.locator("#action-delete");

    // ── ARIA Attributes (static) ────────────────────────────
    // APG: button element has aria-haspopup set to "true"
    await expect(trigger).toHaveAttribute("aria-haspopup", "true");
    // APG: When menu is hidden, aria-expanded is "false"
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // ── Click → Open Menu ───────────────────────────────────
    // APG: Activating the button opens the menu
    await trigger.click();
    await expect(firstItem).toBeFocused();
    // APG: When menu is displayed, aria-expanded is "true"
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // ── Escape → Close Menu + Restore Focus ─────────────────
    // APG: Escape closes the menu, sets focus on menu button
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // ── Enter → Open Menu ───────────────────────────────────
    // APG: Enter opens the menu, places focus on first menu item
    await page.keyboard.press("Enter");
    await expect(firstItem).toBeFocused();

    // ── Arrow Navigation (with loop) ────────────────────────
    // APG: Down Arrow moves focus to next menu item
    await page.keyboard.press("ArrowDown");
    await expect(secondItem).toBeFocused();

    // APG: Up Arrow moves focus to previous menu item
    await page.keyboard.press("ArrowUp");
    await expect(firstItem).toBeFocused();

    // APG: Up Arrow on first item wraps to last item
    await page.keyboard.press("ArrowUp");
    await expect(lastItem).toBeFocused();

    // ── Escape again → Close + Restore ──────────────────────
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  },
};
