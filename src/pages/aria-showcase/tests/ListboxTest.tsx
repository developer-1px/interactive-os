/**
 * Listbox ARIA Pattern Tests
 *
 * Tests vertical navigation, selection, Home/End keys, and typeahead
 */

import type { TestBot } from "@os/testBot";

export function defineListboxTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Listbox: Vertical Navigation
  // Verifies: ArrowUp/Down navigation through options
  // ─────────────────────────────────────────────────────────────
  bot.describe("Listbox: Vertical Navigation", async (t) => {
    // 1. Initial focus on first option (Wade Cooper)
    await t.click("#user-0");
    await t.expect("#user-0").focused();
    await t.expect("#user-0").toHaveAttr("aria-selected", "true");

    // 2. ArrowDown → Arlene Mccoy
    await t.press("ArrowDown");
    await t.expect("#user-1").focused();
    await t.expect("#user-1").toHaveAttr("aria-selected", "true");
    await t.expect("#user-0").toHaveAttr("aria-selected", "false");

    // 3. ArrowDown → Devon Webb
    await t.press("ArrowDown");
    await t.expect("#user-2").focused();
    await t.expect("#user-2").toHaveAttr("aria-selected", "true");

    // 4. ArrowDown → Tom Cook
    await t.press("ArrowDown");
    await t.expect("#user-3").focused();

    // 5. ArrowDown → Tanya Fox
    await t.press("ArrowDown");
    await t.expect("#user-4").focused();

    // 6. ArrowUp → Tom Cook
    await t.press("ArrowUp");
    await t.expect("#user-3").focused();

    // 7. ArrowUp → Devon Webb
    await t.press("ArrowUp");
    await t.expect("#user-2").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Listbox: Home/End Keys
  // Verifies: Home jumps to first, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Listbox: Home/End Navigation", async (t) => {
    // 1. Start at middle option
    await t.click("#user-2");
    await t.expect("#user-2").focused();

    // 2. Home → First option
    await t.press("Home");
    await t.expect("#user-0").focused();
    await t.expect("#user-0").toHaveAttr("aria-selected", "true");

    // 3. End → Last option
    await t.press("End");
    await t.expect("#user-4").focused();
    await t.expect("#user-4").toHaveAttr("aria-selected", "true");

    // 4. Home again
    await t.press("Home");
    await t.expect("#user-0").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Listbox: Click Selection
  // Verifies: Click selects option (followFocus behavior)
  // ─────────────────────────────────────────────────────────────
  bot.describe("Listbox: Click Selection", async (t) => {
    // 1. Click first option
    await t.click("#user-0");
    await t.expect("#user-0").focused();
    await t.expect("#user-0").toHaveAttr("aria-selected", "true");

    // 2. Click third option
    await t.click("#user-2");
    await t.expect("#user-2").focused();
    await t.expect("#user-2").toHaveAttr("aria-selected", "true");
    await t.expect("#user-0").toHaveAttr("aria-selected", "false");

    // 3. Click last option
    await t.click("#user-4");
    await t.expect("#user-4").focused();
    await t.expect("#user-4").toHaveAttr("aria-selected", "true");
    await t.expect("#user-2").toHaveAttr("aria-selected", "false");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Listbox: Sequential Navigation
  // Verifies: Complete traversal from first to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Listbox: Sequential Traversal", async (t) => {
    // 1. Start at first option
    await t.click("#user-0");
    await t.expect("#user-0").focused();

    // 2. Navigate through all options
    await t.press("ArrowDown");
    await t.expect("#user-1").focused();

    await t.press("ArrowDown");
    await t.expect("#user-2").focused();

    await t.press("ArrowDown");
    await t.expect("#user-3").focused();

    await t.press("ArrowDown");
    await t.expect("#user-4").focused();

    // 3. Navigate back through all options
    await t.press("ArrowUp");
    await t.expect("#user-3").focused();

    await t.press("ArrowUp");
    await t.expect("#user-2").focused();

    await t.press("ArrowUp");
    await t.expect("#user-1").focused();

    await t.press("ArrowUp");
    await t.expect("#user-0").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Listbox: Selection Follows Focus
  // Verifies: aria-selected updates as focus moves
  // ─────────────────────────────────────────────────────────────
  bot.describe("Listbox: Selection Follows Focus", async (t) => {
    // 1. Start at first option
    await t.click("#user-0");
    await t.expect("#user-0").toHaveAttr("aria-selected", "true");

    // 2. Move focus → selection follows
    await t.press("ArrowDown");
    await t.expect("#user-1").toHaveAttr("aria-selected", "true");
    await t.expect("#user-0").toHaveAttr("aria-selected", "false");

    await t.press("ArrowDown");
    await t.expect("#user-2").toHaveAttr("aria-selected", "true");
    await t.expect("#user-1").toHaveAttr("aria-selected", "false");

    // 3. Jump to end
    await t.press("End");
    await t.expect("#user-4").toHaveAttr("aria-selected", "true");
    await t.expect("#user-2").toHaveAttr("aria-selected", "false");

    // 4. Jump to start
    await t.press("Home");
    await t.expect("#user-0").toHaveAttr("aria-selected", "true");
    await t.expect("#user-4").toHaveAttr("aria-selected", "false");
  });
}
