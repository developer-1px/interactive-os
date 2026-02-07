/**
 * Menu ARIA Pattern Tests
 *
 * Tests vertical navigation, menuitem/menuitemcheckbox, disabled items, and separators
 */

import type { TestBot } from "@os/testBot";

export function defineMenuTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Menu: Vertical Navigation
  // Verifies: ArrowUp/Down navigation, loop behavior
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Vertical Navigation", async (t) => {
    // 1. Initial focus on first menuitem
    await t.click("#menu-new");
    await t.expect("#menu-new").focused();

    // 2. ArrowDown → Open
    await t.press("ArrowDown");
    await t.expect("#menu-open").focused();

    // 3. ArrowDown → Skip separator, go to Ruler checkbox
    await t.press("ArrowDown");
    await t.expect("#menu-ruler").focused();

    // 4. ArrowDown → Grid checkbox
    await t.press("ArrowDown");
    await t.expect("#menu-grid").focused();

    // 5. ArrowDown → Skip separator, go to Disabled
    await t.press("ArrowDown");
    await t.expect("#menu-disabled").focused();
    await t.expect("#menu-disabled").toHaveAttr("aria-disabled", "true");

    // 6. ArrowDown → Loop back to New
    await t.press("ArrowDown");
    await t.expect("#menu-new").focused();

    // 7. ArrowUp → Reverse to Disabled
    await t.press("ArrowUp");
    await t.expect("#menu-disabled").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Menu: Checkbox Toggle
  // Verifies: menuitemcheckbox aria-checked state
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Checkbox Toggle", async (t) => {
    // 1. Navigate to Ruler checkbox
    await t.click("#menu-ruler");
    await t.expect("#menu-ruler").focused();

    // 2. Check initial state (should be checked by default)
    await t.expect("#menu-ruler").toHaveAttr("aria-checked", "true");

    // 3. Press Space/Enter to toggle
    await t.press("Enter");
    await t.expect("#menu-ruler").toHaveAttr("aria-checked", "false");

    // 4. Toggle again
    await t.press("Enter");
    await t.expect("#menu-ruler").toHaveAttr("aria-checked", "true");

    // 5. Navigate to Grid checkbox
    await t.press("ArrowDown");
    await t.expect("#menu-grid").focused();
    await t.expect("#menu-grid").toHaveAttr("aria-checked", "false");

    // 6. Toggle Grid checkbox
    await t.press("Enter");
    await t.expect("#menu-grid").toHaveAttr("aria-checked", "true");

    // 7. Verify Ruler checkbox state unchanged
    await t.press("ArrowUp");
    await t.expect("#menu-ruler").toHaveAttr("aria-checked", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Menu: Home/End Keys
  // Verifies: Home jumps to first, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Home/End Navigation", async (t) => {
    // 1. Start at middle item
    await t.click("#menu-ruler");
    await t.expect("#menu-ruler").focused();

    // 2. Home → First menuitem
    await t.press("Home");
    await t.expect("#menu-new").focused();

    // 3. End → Last menuitem
    await t.press("End");
    await t.expect("#menu-disabled").focused();

    // 4. Home again
    await t.press("Home");
    await t.expect("#menu-new").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Menu: Disabled Item
  // Verifies: Disabled menuitem can receive focus but not activation
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Disabled Item", async (t) => {
    // 1. Navigate to disabled item
    await t.click("#menu-grid");
    await t.press("ArrowDown");
    await t.expect("#menu-disabled").focused();
    await t.expect("#menu-disabled").toHaveAttr("aria-disabled", "true");

    // 2. Try to activate (should not do anything)
    await t.press("Enter");
    await t.expect("#menu-disabled").toHaveAttr("aria-disabled", "true");

    // 3. Navigate away and back
    await t.press("ArrowUp");
    await t.expect("#menu-grid").focused();
    await t.press("ArrowDown");
    await t.expect("#menu-disabled").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Menu: Click Interaction
  // Verifies: Click focuses and activates menuitems
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Click Interaction", async (t) => {
    // 1. Click on New menuitem
    await t.click("#menu-new");
    await t.expect("#menu-new").focused();

    // 2. Click on Ruler checkbox
    await t.click("#menu-ruler");
    await t.expect("#menu-ruler").focused();

    // 3. Click on Grid checkbox
    await t.click("#menu-grid");
    await t.expect("#menu-grid").focused();

    // 4. Click on disabled item
    await t.click("#menu-disabled");
    await t.expect("#menu-disabled").focused();
    await t.expect("#menu-disabled").toHaveAttr("aria-disabled", "true");
  });
}
