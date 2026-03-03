/**
 * APG Menu Button — Spec-Driven TestBot Script
 *
 * Ground Truth: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
 *
 * Every assertion below maps 1:1 to the W3C APG keyboard interaction table.
 * This is NOT reverse-engineered from implementation — it's derived from spec.
 *
 * Coverage:
 *   Static:  aria-haspopup, aria-expanded (closed)
 *   B1:      Click → open menu, focus first item, aria-expanded=true
 *   B2:      Escape → close menu, focus restore, aria-expanded=false
 *   B3:      Enter → open menu, focus first item
 *   B4:      Space → open menu, focus first item
 *   M1-M2:  ArrowDown/Up navigation
 *   M3:      Loop wrapping (Up at first → last, Down at last → first)
 *   M4-M5:  Home/End
 *   M6:      Enter on menuitem → activates + closes menu + focus restore
 *   D1:      Escape from any position → close + focus restore
 */

import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgMenuButtonScript: TestScript = {
  name: "APG Menu Button — Click + Keyboard + ARIA",
  group: "APG",
  async run(page, expect = defaultExpect) {
    // Navigate to the Menu Button pattern tab
    await page.locator("#tab-menu-button").click();

    const trigger = page.locator("#apg-menu-button-popup-trigger");
    const firstItem = page.locator("#action-cut");
    const secondItem = page.locator("#action-copy");
    const thirdItem = page.locator("#action-paste");
    const lastItem = page.locator("#action-delete");

    // ── Static ARIA Attributes ──────────────────────────────
    // APG: button has aria-haspopup="true" (or "menu")
    await expect(trigger).toHaveAttribute("aria-haspopup", "true");
    // APG: When menu is hidden, aria-expanded="false"
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // ── B1: Click → Open Menu ───────────────────────────────
    // APG: Activating the button opens the menu, focus on first item
    await trigger.click();
    await expect(firstItem).toBeFocused();
    // APG: When menu is displayed, aria-expanded="true"
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // ── D1: Escape → Close Menu + Restore Focus ─────────────
    // APG: Escape closes the menu, sets focus on menu button
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // ── B3: Enter → Open Menu ───────────────────────────────
    // APG: Enter opens the menu, places focus on first menu item
    await page.keyboard.press("Enter");
    await expect(firstItem).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Close for next test
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();

    // ── B4: Space → Open Menu ───────────────────────────────
    // APG: Space opens the menu, places focus on first menu item
    await page.keyboard.press(" ");
    await expect(firstItem).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // ── M1: ArrowDown → Next Item ───────────────────────────
    // APG: Down Arrow moves focus to next menu item
    await page.keyboard.press("ArrowDown");
    await expect(secondItem).toBeFocused();

    // ── M2: ArrowUp → Previous Item ─────────────────────────
    // APG: Up Arrow moves focus to previous menu item
    await page.keyboard.press("ArrowUp");
    await expect(firstItem).toBeFocused();

    // ── M3: Loop Wrapping ───────────────────────────────────
    // APG: Up Arrow on first item wraps to last item
    await page.keyboard.press("ArrowUp");
    await expect(lastItem).toBeFocused();

    // APG: Down Arrow on last item wraps to first item
    await page.keyboard.press("ArrowDown");
    await expect(firstItem).toBeFocused();

    // ── M4-M5: Home/End ─────────────────────────────────────
    // APG: Home moves focus to first menu item
    await page.keyboard.press("ArrowDown"); // move to second
    await page.keyboard.press("Home");
    await expect(firstItem).toBeFocused();

    // APG: End moves focus to last menu item
    await page.keyboard.press("End");
    await expect(lastItem).toBeFocused();

    // ── M6: Enter on menuitem → Activate + Close ────────────
    // APG: Enter activates item, closes menu, focus returns to button
    // Navigate to a specific item first
    await page.keyboard.press("Home");
    await expect(firstItem).toBeFocused();
    await page.keyboard.press("Enter");
    // Menu should close and focus should return to trigger
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // ── D1 (again): Escape from middle of menu ──────────────
    // Open menu again, navigate to a non-first item, then Escape
    await page.keyboard.press("Enter");
    await expect(firstItem).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(thirdItem).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
