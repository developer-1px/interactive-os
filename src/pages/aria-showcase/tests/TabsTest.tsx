/**
 * Tabs ARIA Pattern Tests
 *
 * Tests horizontal navigation, selection, disabled states, and Home/End keys
 */

import type { TestBot } from "@os/testBot";

export function defineTabsTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Tabs: Horizontal Navigation
  // Verifies: ArrowLeft/Right navigation, loop behavior
  // ─────────────────────────────────────────────────────────────
  bot.describe("Tabs: Horizontal Navigation", async (t) => {
    // 1. Initial focus on first tab
    await t.click("#tab-account");
    await t.expect("#tab-account").toBeFocused();
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "true");

    // 2. ArrowRight → Security tab
    await t.press("ArrowRight");
    await t.expect("#tab-security").toBeFocused();
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "true");
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "false");

    // 3. ArrowRight → Disabled tab (should still navigate)
    await t.press("ArrowRight");
    await t.expect("#tab-disabled").toBeFocused();
    await t.expect("#tab-disabled").toHaveAttribute("aria-disabled", "true");

    // 4. ArrowRight → Loop back to Account
    await t.press("ArrowRight");
    await t.expect("#tab-account").toBeFocused();

    // 5. ArrowLeft → Reverse to Disabled
    await t.press("ArrowLeft");
    await t.expect("#tab-disabled").toBeFocused();

    // 6. ArrowLeft → Security
    await t.press("ArrowLeft");
    await t.expect("#tab-security").toBeFocused();

    // 7. ArrowLeft → Account
    await t.press("ArrowLeft");
    await t.expect("#tab-account").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Tabs: Home/End Keys
  // Verifies: Home jumps to first, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Tabs: Home/End Navigation", async (t) => {
    // 1. Start at middle tab
    await t.click("#tab-security");
    await t.expect("#tab-security").toBeFocused();

    // 2. Home → First tab
    await t.press("Home");
    await t.expect("#tab-account").toBeFocused();

    // 3. End → Last tab
    await t.press("End");
    await t.expect("#tab-disabled").toBeFocused();

    // 4. Home again
    await t.press("Home");
    await t.expect("#tab-account").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Tabs: Click Selection
  // Verifies: Click changes selection and panel content
  // ─────────────────────────────────────────────────────────────
  bot.describe("Tabs: Click Selection", async (t) => {
    // 1. Click Account tab
    await t.click("#tab-account");
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "true");
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "false");

    // 2. Click Security tab
    await t.click("#tab-security");
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "true");
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "false");

    // 3. Click back to Account
    await t.click("#tab-account");
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "true");
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "false");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Tabs: Disabled State
  // Verifies: Disabled tab can receive focus but not selection
  // ─────────────────────────────────────────────────────────────
  bot.describe("Tabs: Disabled State", async (t) => {
    // 1. Navigate to disabled tab
    await t.click("#tab-security");
    await t.press("ArrowRight");
    await t.expect("#tab-disabled").toBeFocused();
    await t.expect("#tab-disabled").toHaveAttribute("aria-disabled", "true");

    // 2. Navigate away and back — disabled tab can still receive focus
    await t.press("ArrowRight");
    await t.expect("#tab-account").toBeFocused();
    await t.press("ArrowLeft");
    await t.expect("#tab-disabled").toBeFocused();
  });
}
