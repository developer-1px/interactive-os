/**
 * Toolbar ARIA Pattern Tests
 *
 * Tests horizontal navigation, toggle buttons, aria-pressed state, and disabled buttons
 */

import type { TestBot } from "@os/testBot";

export function defineToolbarTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Toolbar: Horizontal Navigation
  // Verifies: ArrowLeft/Right navigation, loop behavior
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toolbar: Horizontal Navigation", async (t) => {
    // 1. Initial focus on Bold button
    await t.click("#tool-bold");
    await t.expect("#tool-bold").focused();

    // 2. ArrowRight → Italic
    await t.press("ArrowRight");
    await t.expect("#tool-italic").focused();

    // 3. ArrowRight → Underline
    await t.press("ArrowRight");
    await t.expect("#tool-underline").focused();

    // 4. ArrowRight → Strikethrough
    await t.press("ArrowRight");
    await t.expect("#tool-strike").focused();

    // 5. ArrowRight → Disabled button
    await t.press("ArrowRight");
    await t.expect("#tool-disabled").focused();
    await t.expect("#tool-disabled").toHaveAttr("aria-disabled", "true");

    // 6. ArrowRight → Loop back to Bold
    await t.press("ArrowRight");
    await t.expect("#tool-bold").focused();

    // 7. ArrowLeft → Reverse to Disabled
    await t.press("ArrowLeft");
    await t.expect("#tool-disabled").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Toolbar: Toggle Buttons
  // Verifies: aria-pressed state toggles on click/Enter
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toolbar: Toggle Buttons", async (t) => {
    // 1. Bold button (initially pressed)
    await t.click("#tool-bold");
    await t.expect("#tool-bold").toHaveAttr("aria-pressed", "true");

    // 2. Toggle Bold off
    await t.press("Enter");
    await t.expect("#tool-bold").toHaveAttr("aria-pressed", "false");

    // 3. Toggle Bold on again
    await t.press("Enter");
    await t.expect("#tool-bold").toHaveAttr("aria-pressed", "true");

    // 4. Navigate to Italic and toggle
    await t.press("ArrowRight");
    await t.expect("#tool-italic").focused();
    await t.expect("#tool-italic").toHaveAttr("aria-pressed", "false");

    await t.press("Enter");
    await t.expect("#tool-italic").toHaveAttr("aria-pressed", "true");

    // 5. Verify Bold state unchanged
    await t.press("ArrowLeft");
    await t.expect("#tool-bold").toHaveAttr("aria-pressed", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Toolbar: Click Toggle
  // Verifies: Click toggles aria-pressed state
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toolbar: Click Toggle", async (t) => {
    // State after previous test: bold=true, italic=true
    // Each click focuses AND toggles

    // 1. Click Bold → toggles from true→false
    await t.click("#tool-bold");
    await t.expect("#tool-bold").toHaveAttr("aria-pressed", "false");

    // 2. Click Bold again → toggles from false→true
    await t.click("#tool-bold");
    await t.expect("#tool-bold").toHaveAttr("aria-pressed", "true");

    // 3. Click Italic → toggles from true→false
    await t.click("#tool-italic");
    await t.expect("#tool-italic").toHaveAttr("aria-pressed", "false");

    // 4. Click Italic again → toggles from false→true
    await t.click("#tool-italic");
    await t.expect("#tool-italic").toHaveAttr("aria-pressed", "true");

    // 5. Click Underline → toggles from false→true
    await t.click("#tool-underline");
    await t.expect("#tool-underline").toHaveAttr("aria-pressed", "true");

    // 6. Click Underline again → toggles from true→false
    await t.click("#tool-underline");
    await t.expect("#tool-underline").toHaveAttr("aria-pressed", "false");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Toolbar: Disabled Button
  // Verifies: Disabled button can receive focus but not toggle
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toolbar: Disabled Button", async (t) => {
    // 1. Navigate to disabled button
    await t.click("#tool-strike");
    await t.press("ArrowRight");
    await t.expect("#tool-disabled").focused();
    await t.expect("#tool-disabled").toHaveAttr("aria-disabled", "true");

    // 2. Try to toggle (should not work)
    await t.press("Enter");
    await t.expect("#tool-disabled").toHaveAttr("aria-disabled", "true");

    // 3. Click disabled button
    await t.click("#tool-disabled");
    await t.expect("#tool-disabled").focused();
    await t.expect("#tool-disabled").toHaveAttr("aria-disabled", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Toolbar: Home/End Keys
  // Verifies: Home jumps to first, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toolbar: Home/End Navigation", async (t) => {
    // 1. Start at middle button
    await t.click("#tool-underline");
    await t.expect("#tool-underline").focused();

    // 2. Home → First button
    await t.press("Home");
    await t.expect("#tool-bold").focused();

    // 3. End → Last button
    await t.press("End");
    await t.expect("#tool-disabled").focused();

    // 4. Home again
    await t.press("Home");
    await t.expect("#tool-bold").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Toolbar: Multiple Toggles
  // Verifies: Multiple buttons can be pressed simultaneously
  // ─────────────────────────────────────────────────────────────
  bot.describe("Toolbar: Multiple Toggles", async (t) => {
    // After tests 1-5:
    //   bold:      1 click (test1) + 1 click (test2) + 2 Enter (test2) + 2 click (test3) = even → true (initial)
    //   italic:    1 Enter (test2) + 2 click (test3) = odd from false → true
    //   underline: 2 click (test3) + 1 click (test5) = odd from false → true
    //   strike:    1 click (test4) = odd from false → true
    // Ergo: all are true at this point

    // 1. Focus Italic via Arrow (no click to avoid toggle)
    await t.click("#tool-bold"); // bold: true→false
    await t.press("ArrowRight");
    await t.expect("#tool-italic").focused();

    // 2. Italic is true, Enter → false
    await t.press("Enter");
    await t.expect("#tool-italic").toHaveAttr("aria-pressed", "false");

    // 3. Navigate to Strike
    await t.press("ArrowRight"); // underline
    await t.press("ArrowRight"); // strike
    await t.expect("#tool-strike").focused();

    // 4. Strike is true, Enter → false
    await t.press("Enter");
    await t.expect("#tool-strike").toHaveAttr("aria-pressed", "false");
  });
}
