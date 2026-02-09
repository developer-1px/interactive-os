/**
 * Grid ARIA Pattern Tests
 *
 * Tests 2D navigation (all 4 directions), multi-select, and aria-selected state
 */

import type { TestBot } from "@os/testBot";

export function defineGridTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Grid: 2D Navigation (Perimeter)
  // Verifies: All 4 arrow keys work correctly
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: 2D Navigation Perimeter", async (t) => {
    // 1. Start at top-left (cell-0)
    await t.click("#cell-0");
    await t.expect("#cell-0").toBeFocused();

    // 2. Right across top row: 0 → 1 → 2 → 3
    await t.press("ArrowRight");
    await t.expect("#cell-1").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-2").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-3").toBeFocused();

    // 3. Down along right column: 3 → 7 → 11
    await t.press("ArrowDown");
    await t.expect("#cell-7").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#cell-11").toBeFocused();

    // 4. Left across bottom row: 11 → 10 → 9 → 8
    await t.press("ArrowLeft");
    await t.expect("#cell-10").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-9").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-8").toBeFocused();

    // 5. Up along left column: 8 → 4 → 0
    await t.press("ArrowUp");
    await t.expect("#cell-4").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#cell-0").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Grid: Center Navigation
  // Verifies: All 4 directions from center cells
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Center Navigation", async (t) => {
    // 1. Navigate to center cell (cell-5)
    await t.click("#cell-0");
    await t.press("ArrowRight");
    await t.press("ArrowDown");
    await t.expect("#cell-5").toBeFocused();

    // 2. Test all 4 directions from center
    await t.press("ArrowUp");
    await t.expect("#cell-1").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-6").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-4").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#cell-9").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#cell-5").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Grid: Multi-Select
  // Verifies: Multiple cells can be selected
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Multi-Select", async (t) => {
    // 1. Click first cell
    await t.click("#cell-0");
    await t.expect("#cell-0").toHaveAttribute("aria-selected", "true");

    // 2. Click third cell (both should be selected)
    await t.click("#cell-2");
    await t.expect("#cell-2").toHaveAttribute("aria-selected", "true");
    await t.expect("#cell-0").toHaveAttribute("aria-selected", "true");

    // 3. Click fifth cell
    await t.click("#cell-4");
    await t.expect("#cell-4").toHaveAttribute("aria-selected", "true");
    await t.expect("#cell-0").toHaveAttribute("aria-selected", "true");
    await t.expect("#cell-2").toHaveAttribute("aria-selected", "true");

    // 4. Click first cell again to deselect
    await t.click("#cell-0");
    await t.expect("#cell-0").toHaveAttribute("aria-selected", "false");
    await t.expect("#cell-2").toHaveAttribute("aria-selected", "true");
    await t.expect("#cell-4").toHaveAttribute("aria-selected", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Grid: Row Navigation
  // Verifies: Complete row traversal
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Row Navigation", async (t) => {
    // 1. Navigate across first row (0-3)
    await t.click("#cell-0");
    await t.expect("#cell-0").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-1").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-2").toBeFocused();

    await t.press("ArrowRight");
    await t.expect("#cell-3").toBeFocused();

    // 2. Navigate across second row (4-7)
    await t.press("ArrowDown");
    await t.expect("#cell-7").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-6").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowLeft");
    await t.expect("#cell-4").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Grid: Column Navigation
  // Verifies: Complete column traversal
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Column Navigation", async (t) => {
    // 1. Navigate down first column (0, 4, 8)
    await t.click("#cell-0");
    await t.expect("#cell-0").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#cell-4").toBeFocused();

    await t.press("ArrowDown");
    await t.expect("#cell-8").toBeFocused();

    // 2. Navigate up second column (9, 5, 1)
    await t.press("ArrowRight");
    await t.expect("#cell-9").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowUp");
    await t.expect("#cell-1").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Grid: Home/End Keys
  // Verifies: Home jumps to first cell, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Home/End Navigation", async (t) => {
    // 1. Start at middle cell (cell-5, row 2)
    await t.click("#cell-5");
    await t.expect("#cell-5").toBeFocused();

    // 2. Home → First cell in grid (cell-0)
    await t.press("Home");
    await t.expect("#cell-0").toBeFocused();

    // 3. End → Last cell in grid (cell-11)
    await t.press("End");
    await t.expect("#cell-11").toBeFocused();

    // 4. Home again → back to first
    await t.press("Home");
    await t.expect("#cell-0").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Grid: Diagonal Navigation
  // Verifies: Combined arrow key movements
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Diagonal Navigation", async (t) => {
    // 1. Start at top-left
    await t.click("#cell-0");
    await t.expect("#cell-0").toBeFocused();

    // 2. Diagonal down-right: 0 → 5 → 10
    await t.press("ArrowRight");
    await t.press("ArrowDown");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowRight");
    await t.press("ArrowDown");
    await t.expect("#cell-10").toBeFocused();

    // 3. Diagonal up-left: 10 → 5 → 0
    await t.press("ArrowLeft");
    await t.press("ArrowUp");
    await t.expect("#cell-5").toBeFocused();

    await t.press("ArrowLeft");
    await t.press("ArrowUp");
    await t.expect("#cell-0").toBeFocused();
  });
}
