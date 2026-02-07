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
    await t.expect("#cell-0").focused();

    // 2. Right across top row: 0 → 1 → 2 → 3
    await t.press("ArrowRight");
    await t.expect("#cell-1").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-2").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-3").focused();

    // 3. Down along right column: 3 → 7 → 11
    await t.press("ArrowDown");
    await t.expect("#cell-7").focused();

    await t.press("ArrowDown");
    await t.expect("#cell-11").focused();

    // 4. Left across bottom row: 11 → 10 → 9 → 8
    await t.press("ArrowLeft");
    await t.expect("#cell-10").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-9").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-8").focused();

    // 5. Up along left column: 8 → 4 → 0
    await t.press("ArrowUp");
    await t.expect("#cell-4").focused();

    await t.press("ArrowUp");
    await t.expect("#cell-0").focused();
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
    await t.expect("#cell-5").focused();

    // 2. Test all 4 directions from center
    await t.press("ArrowUp");
    await t.expect("#cell-1").focused();

    await t.press("ArrowDown");
    await t.expect("#cell-5").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-6").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-5").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-4").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-5").focused();

    await t.press("ArrowDown");
    await t.expect("#cell-9").focused();

    await t.press("ArrowUp");
    await t.expect("#cell-5").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Grid: Multi-Select
  // Verifies: Multiple cells can be selected
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Multi-Select", async (t) => {
    // 1. Click first cell
    await t.click("#cell-0");
    await t.expect("#cell-0").toHaveAttr("aria-selected", "true");

    // 2. Click third cell (both should be selected)
    await t.click("#cell-2");
    await t.expect("#cell-2").toHaveAttr("aria-selected", "true");
    await t.expect("#cell-0").toHaveAttr("aria-selected", "true");

    // 3. Click fifth cell
    await t.click("#cell-4");
    await t.expect("#cell-4").toHaveAttr("aria-selected", "true");
    await t.expect("#cell-0").toHaveAttr("aria-selected", "true");
    await t.expect("#cell-2").toHaveAttr("aria-selected", "true");

    // 4. Click first cell again to deselect
    await t.click("#cell-0");
    await t.expect("#cell-0").toHaveAttr("aria-selected", "false");
    await t.expect("#cell-2").toHaveAttr("aria-selected", "true");
    await t.expect("#cell-4").toHaveAttr("aria-selected", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Grid: Row Navigation
  // Verifies: Complete row traversal
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Row Navigation", async (t) => {
    // 1. Navigate across first row (0-3)
    await t.click("#cell-0");
    await t.expect("#cell-0").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-1").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-2").focused();

    await t.press("ArrowRight");
    await t.expect("#cell-3").focused();

    // 2. Navigate across second row (4-7)
    await t.press("ArrowDown");
    await t.expect("#cell-7").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-6").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-5").focused();

    await t.press("ArrowLeft");
    await t.expect("#cell-4").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Grid: Column Navigation
  // Verifies: Complete column traversal
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Column Navigation", async (t) => {
    // 1. Navigate down first column (0, 4, 8)
    await t.click("#cell-0");
    await t.expect("#cell-0").focused();

    await t.press("ArrowDown");
    await t.expect("#cell-4").focused();

    await t.press("ArrowDown");
    await t.expect("#cell-8").focused();

    // 2. Navigate up second column (9, 5, 1)
    await t.press("ArrowRight");
    await t.expect("#cell-9").focused();

    await t.press("ArrowUp");
    await t.expect("#cell-5").focused();

    await t.press("ArrowUp");
    await t.expect("#cell-1").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Grid: Home/End Keys
  // Verifies: Home jumps to first cell, End jumps to last
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Home/End Navigation", async (t) => {
    // 1. Start at middle cell
    await t.click("#cell-5");
    await t.expect("#cell-5").focused();

    // 2. Home → First cell
    await t.press("Home");
    await t.expect("#cell-0").focused();

    // 3. End → Last cell
    await t.press("End");
    await t.expect("#cell-11").focused();

    // 4. Home again
    await t.press("Home");
    await t.expect("#cell-0").focused();
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Grid: Diagonal Navigation
  // Verifies: Combined arrow key movements
  // ─────────────────────────────────────────────────────────────
  bot.describe("Grid: Diagonal Navigation", async (t) => {
    // 1. Start at top-left
    await t.click("#cell-0");
    await t.expect("#cell-0").focused();

    // 2. Diagonal down-right: 0 → 5 → 10
    await t.press("ArrowRight");
    await t.press("ArrowDown");
    await t.expect("#cell-5").focused();

    await t.press("ArrowRight");
    await t.press("ArrowDown");
    await t.expect("#cell-10").focused();

    // 3. Diagonal up-left: 10 → 5 → 0
    await t.press("ArrowLeft");
    await t.press("ArrowUp");
    await t.expect("#cell-5").focused();

    await t.press("ArrowLeft");
    await t.press("ArrowUp");
    await t.expect("#cell-0").focused();
  });
}
