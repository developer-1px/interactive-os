/**
 * Combobox, Accordion, Dialog, Feed, and other complex ARIA pattern tests
 */

import type { TestBot } from "@os/testBot";

// ═══════════════════════════════════════════════════════════════════
// Menubar Tests
// ═══════════════════════════════════════════════════════════════════
export function defineMenubarTests(bot: TestBot) {
  bot.describe("Menubar: Horizontal Navigation", async (t) => {
    await t.click("#menubar-file");
    await t.expect("#menubar-file").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#menubar-edit").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#menubar-view").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#menubar-help").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#menubar-view").toBeFocused();
  });
}

// ═══════════════════════════════════════════════════════════════════
// Combobox Tests
// ═══════════════════════════════════════════════════════════════════
export function defineComboboxTests(bot: TestBot) {
  bot.describe("Combobox: Trigger Focus", async (t) => {
    await t.click("#combo-trigger");
    await t.expect("#combo-trigger").toBeFocused();
    await t.expect("#combo-trigger").toHaveAttribute("aria-expanded", "true");
  });

  bot.describe("Combobox: Listbox Navigation", async (t) => {
    // Combobox is already open from previous test
    // Click first option to focus into the listbox
    await t.click("#combo-opt-0");
    await t.expect("#combo-opt-0").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#combo-opt-1").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#combo-opt-2").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#combo-opt-1").toBeFocused();
  });

  bot.describe("Combobox: Invalid State", async (t) => {
    await t.click("#combo-trigger");
    await t.expect("#combo-trigger").toHaveAttribute("aria-invalid", "false");

    // Note: Invalid state is toggled by checkbox, not tested here
  });
}

// ═══════════════════════════════════════════════════════════════════
// Accordion Tests
// ═══════════════════════════════════════════════════════════════════
export function defineAccordionTests(bot: TestBot) {
  bot.describe("Accordion: Expand/Collapse", async (t) => {
    await t.click("#acc-1-trigger");
    await t.expect("#acc-1-trigger").toBeFocused();
    await t.expect("#acc-1-trigger").toHaveAttribute("aria-expanded", "true");

    await t.press("Enter");
    await t.expect("#acc-1-trigger").toHaveAttribute("aria-expanded", "false");

    await t.press("Enter");
    await t.expect("#acc-1-trigger").toHaveAttribute("aria-expanded", "true");
  });

  bot.describe("Accordion: Navigation", async (t) => {
    await t.click("#acc-1-trigger");
    await t.press("ArrowDown");
    await t.expect("#acc-2-trigger").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#acc-3-trigger").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#acc-2-trigger").toBeFocused();
  });
}

// ═══════════════════════════════════════════════════════════════════
// Dialog Tests
// ═══════════════════════════════════════════════════════════════════
export function defineDialogTests(bot: TestBot) {
  bot.describe("Dialog: Focus Trap", async (t) => {
    await t.click("#btn-dialog-trigger");
    await t.wait(500);

    await t.expect("#dialog-btn-1").toBeFocused();

    await t.press("Tab");
    await t.expect("#dialog-btn-2").toBeFocused();

    await t.press("Tab");
    await t.expect("#dialog-btn-close").toBeFocused();

    await t.press("Tab");
    await t.expect("#dialog-btn-1").toBeFocused(); // Trapped
  });

  bot.describe("Dialog: Escape to Close", async (t) => {
    await t.click("#btn-dialog-trigger");
    await t.wait(500);

    await t.press("Escape");
    await t.expect("#btn-dialog-trigger").toBeFocused(); // Focus restored
  });
}

// ═══════════════════════════════════════════════════════════════════
// Alert Dialog Tests
// ═══════════════════════════════════════════════════════════════════
export function defineAlertDialogTests(bot: TestBot) {
  bot.describe("AlertDialog: Focus Trap", async (t) => {
    await t.click("#btn-alert-trigger");
    await t.wait(500);

    await t.expect("#alert-cancel").toBeFocused();

    await t.press("Tab");
    await t.expect("#alert-confirm").toBeFocused();

    await t.press("Tab");
    await t.expect("#alert-cancel").toBeFocused(); // Trapped
  });

  bot.describe("AlertDialog: Cancel Action", async (t) => {
    await t.click("#btn-alert-trigger");
    await t.wait(500);

    await t.click("#alert-cancel");
    await t.expect("#btn-alert-trigger").toBeFocused(); // Focus restored
  });
}

// ═══════════════════════════════════════════════════════════════════
// Feed Tests
// ═══════════════════════════════════════════════════════════════════
export function defineFeedTests(bot: TestBot) {
  bot.describe("Feed: Vertical Navigation", async (t) => {
    await t.click("#feed-1");
    await t.expect("#feed-1").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#feed-2").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#feed-3").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#feed-2").toBeFocused();
  });

  bot.describe("Feed: Click Articles", async (t) => {
    await t.click("#feed-1");
    await t.expect("#feed-1").toBeFocused();

    await t.click("#feed-3");
    await t.expect("#feed-3").toBeFocused();

    await t.click("#feed-2");
    await t.expect("#feed-2").toBeFocused();
  });
}
