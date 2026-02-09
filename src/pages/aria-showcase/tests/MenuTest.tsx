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
    await t.expect("#menu-new").toBeFocused();

    // 2. ArrowDown → Open
    await t.press("ArrowDown");
    await t.expect("#menu-open").toBeFocused();

    // 3. ArrowDown → Skip separator, go to Ruler checkbox
    await t.press("ArrowDown");
    await t.expect("#menu-ruler").toBeFocused();

    // 4. ArrowDown → Grid checkbox
    await t.press("ArrowDown");
    await t.expect("#menu-grid").toBeFocused();

    // 5. ArrowDown → Skip separator, go to Disabled
    await t.press("ArrowDown");
    await t.expect("#menu-disabled").toBeFocused();
    await t.expect("#menu-disabled").toHaveAttribute("aria-disabled", "true");

    // 6. ArrowDown → Loop back to New
    await t.press("ArrowDown");
    await t.expect("#menu-new").toBeFocused();

    // 7. ArrowUp → Reverse to Disabled
    await t.press("ArrowUp");
    await t.expect("#menu-disabled").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Menu: Checkbox Toggle
  // Verifies: menuitemcheckbox aria-checked state
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Checkbox Toggle", async (t) => {
    // State: ruler starts as true from initialization
    // Click toggles the state, so clicking ruler → true→false

    // 1. Navigate to Ruler checkbox (click also toggles)
    await t.click("#menu-ruler");
    await t.expect("#menu-ruler").toBeFocused();
    await t.expect("#menu-ruler").toHaveAttribute("aria-checked", "false");

    // 2. Press Space to toggle back on
    await t.press("Space");
    await t.expect("#menu-ruler").toHaveAttribute("aria-checked", "true");

    // 3. Press Space to toggle off again
    await t.press("Space");
    await t.expect("#menu-ruler").toHaveAttribute("aria-checked", "false");

    // 4. Navigate to Grid checkbox (initially unchecked)
    await t.press("ArrowDown");
    await t.expect("#menu-grid").toBeFocused();
    await t.expect("#menu-grid").toHaveAttribute("aria-checked", "false");

    // 5. Toggle Grid checkbox on
    await t.press("Space");
    await t.expect("#menu-grid").toHaveAttribute("aria-checked", "true");

    // 6. Verify Ruler checkbox state unchanged
    await t.press("ArrowUp");
    await t.expect("#menu-ruler").toHaveAttribute("aria-checked", "false");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Menu: Home/End Keys
  // Verifies: Home jumps to first, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Home/End Navigation", async (t) => {
    // 1. Start at middle item
    await t.click("#menu-ruler");
    await t.expect("#menu-ruler").toBeFocused();

    // 2. Home → First menuitem
    await t.press("Home");
    await t.expect("#menu-new").toBeFocused();

    // 3. End → Last menuitem
    await t.press("End");
    await t.expect("#menu-disabled").toBeFocused();

    // 4. Home again
    await t.press("Home");
    await t.expect("#menu-new").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Menu: Disabled Item
  // Verifies: Disabled menuitem can receive focus but not activation
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Disabled Item", async (t) => {
    // 1. Navigate to disabled item
    await t.click("#menu-grid");
    await t.press("ArrowDown");
    await t.expect("#menu-disabled").toBeFocused();
    await t.expect("#menu-disabled").toHaveAttribute("aria-disabled", "true");

    // 2. Try to activate (should not do anything)
    await t.press("Enter");
    await t.expect("#menu-disabled").toHaveAttribute("aria-disabled", "true");

    // 3. Navigate away and back
    await t.press("ArrowUp");
    await t.expect("#menu-grid").toBeFocused();
    await t.press("ArrowDown");
    await t.expect("#menu-disabled").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Menu: Click Interaction
  // Verifies: Click focuses and activates menuitems
  // ─────────────────────────────────────────────────────────────
  bot.describe("Menu: Click Interaction", async (t) => {
    // 1. Click on New menuitem
    await t.click("#menu-new");
    await t.expect("#menu-new").toBeFocused();

    // 2. Click on Ruler checkbox
    await t.click("#menu-ruler");
    await t.expect("#menu-ruler").toBeFocused();

    // 3. Click on Grid checkbox
    await t.click("#menu-grid");
    await t.expect("#menu-grid").toBeFocused();

    // 4. Click on disabled item
    await t.click("#menu-disabled");
    await t.expect("#menu-disabled").toBeFocused();
    await t.expect("#menu-disabled").toHaveAttribute("aria-disabled", "true");
  });
}
