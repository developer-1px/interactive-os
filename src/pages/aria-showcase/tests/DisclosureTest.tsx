/**
 * Disclosure (Show/Hide) Pattern Tests
 *
 * W3C APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * The Disclosure pattern shows/hides content sections. A disclosure button
 * controls the visibility of its content using aria-expanded.
 */

import type { TestBot } from "@os/testBot";

export function defineDisclosureTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Disclosure: Click to Toggle
  // Verifies: Click expands/collapses, aria-expanded updates
  // ─────────────────────────────────────────────────────────────
  bot.describe("Disclosure: Click Toggle", async (t) => {
    // 1. Click to expand
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").focused();
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "true");

    // 2. Click again to collapse
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "false");

    // 3. Expand again
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Disclosure: Enter Key Toggle
  // Verifies: Enter key activates the disclosure
  // ─────────────────────────────────────────────────────────────
  bot.describe("Disclosure: Enter Key Toggle", async (t) => {
    // State from previous test: isOpen=true
    // 1. Click toggles: true→false
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "false");

    // 2. Enter toggles: false→true
    await t.press("Enter");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "true");

    // 3. Enter toggles: true→false
    await t.press("Enter");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "false");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Disclosure: Space Key Toggle
  // Verifies: Space key activates the disclosure
  // ─────────────────────────────────────────────────────────────
  bot.describe("Disclosure: Space Key Toggle", async (t) => {
    // State from previous test: isOpen=false
    // 1. Click toggles: false→true
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "true");

    // 2. Space toggles: true→false
    await t.press("Space");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "false");

    // 3. Space toggles: false→true
    await t.press("Space");
    await t.expect("#disclosure-trigger").toHaveAttr("aria-expanded", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Disclosure: Focus Retention
  // Verifies: Focus stays on button after toggle
  // ─────────────────────────────────────────────────────────────
  bot.describe("Disclosure: Focus Retention", async (t) => {
    // 1. Click to focus
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").focused();

    // 2. Toggle with Enter, verify focus retained
    await t.press("Enter");
    await t.expect("#disclosure-trigger").focused();

    // 3. Toggle with Space, verify focus retained
    await t.press("Space");
    await t.expect("#disclosure-trigger").focused();

    // 4. Click toggle, verify focus retained
    await t.click("#disclosure-trigger");
    await t.expect("#disclosure-trigger").focused();
  });
}
