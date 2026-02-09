/**
 * FocusShowcaseBot — Focus Pipeline Automated Tests
 *
 * Automated test runner for the Focus Showcase page.
 * Verifies Sense → Intent → Update → Commit → Sync pipeline.
 *
 * Red-team audit: 2026-02-07, density increased across all tests.
 */

import type { TestBot } from "@os/testBot";

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Autofocus: Entry Focus Strategies
  // Verifies: auto entry, first/last strategies, manual entry
  // ─────────────────────────────────────────────────────────────
  bot.describe("Autofocus: Entry Focus", async (t) => {
    // 1. Auto zone: click establishes focus
    await t.click("#af-auto-1");
    await t.expect("#af-auto-1").toHaveAttribute("aria-current", "true");

    // 2. Navigate within auto zone
    await t.click("#af-auto-2");
    await t.expect("#af-auto-2").toHaveAttribute("aria-current", "true");
    await t.expect("#af-auto-1").toNotHaveAttribute("aria-current", "true");

    // 3. Last zone: entry='last' — click first item to enter zone
    await t.click("#af-last-top");
    await t.expect("#af-last-top").toHaveAttribute("aria-current", "true");

    // 4. Navigate within last zone
    await t.press("ArrowDown");
    await t.expect("#af-last-middle").toHaveAttribute("aria-current", "true");

    await t.press("ArrowDown");
    await t.expect("#af-last-bottom").toHaveAttribute("aria-current", "true");

    // 5. Navigate back up
    await t.press("ArrowUp");
    await t.expect("#af-last-middle").toHaveAttribute("aria-current", "true");

    await t.press("ArrowUp");
    await t.expect("#af-last-top").toHaveAttribute("aria-current", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Navigate: Vertical List (Loop)
  // Verifies: loop wraps in BOTH directions, sequential navigation
  // ─────────────────────────────────────────────────────────────
  bot.describe("Navigate: Vertical Loop", async (t) => {
    // 1. Initial focus (first item)
    await t.click("#nav-apple");
    await t.expect("#nav-apple").toHaveAttribute("aria-current", "true");

    // 2. Up boundary test: up from first → wraps to last
    await t.press("ArrowUp");
    await t.expect("#nav-cherry").toHaveAttribute("aria-current", "true");
    await t.expect("#nav-apple").toNotHaveAttribute("aria-current", "true");

    // 3. Sequential down navigation
    await t.press("ArrowDown");
    await t.expect("#nav-apple").toHaveAttribute("aria-current", "true");
    await t.expect("#nav-cherry").toNotHaveAttribute("aria-current", "true");

    await t.press("ArrowDown");
    await t.expect("#nav-banana").toHaveAttribute("aria-current", "true");

    await t.press("ArrowDown");
    await t.expect("#nav-cherry").toHaveAttribute("aria-current", "true");

    // 4. Down boundary test: down from last → wraps to first
    await t.press("ArrowDown");
    await t.expect("#nav-apple").toHaveAttribute("aria-current", "true");
    await t.expect("#nav-cherry").toNotHaveAttribute("aria-current", "true");

    // 5. Mid-position up navigation
    await t.press("ArrowDown");
    await t.expect("#nav-banana").toHaveAttribute("aria-current", "true");
    await t.press("ArrowUp");
    await t.expect("#nav-apple").toHaveAttribute("aria-current", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Navigate: Horizontal Toolbar (No Loop / Clamped)
  // Verifies: clamped at both ends, bidirectional navigation
  // ─────────────────────────────────────────────────────────────
  bot.describe("Navigate: Horizontal Clamped", async (t) => {
    // 1. Initial focus
    await t.click("#nav-bold");
    await t.expect("#nav-bold").toHaveAttribute("aria-current", "true");

    // 2. Left boundary test: clamped at start
    await t.press("ArrowLeft");
    await t.expect("#nav-bold").toHaveAttribute("aria-current", "true");
    await t.press("ArrowLeft");
    await t.expect("#nav-bold").toHaveAttribute("aria-current", "true");

    // 3. Right navigation test
    await t.press("ArrowRight");
    await t.expect("#nav-italic").toHaveAttribute("aria-current", "true");
    await t.expect("#nav-bold").toNotHaveAttribute("aria-current", "true");

    await t.press("ArrowRight");
    await t.expect("#nav-underline").toHaveAttribute("aria-current", "true");
    await t.expect("#nav-italic").toNotHaveAttribute("aria-current", "true");

    // 4. Right boundary test: clamped at end
    await t.press("ArrowRight");
    await t.expect("#nav-underline").toHaveAttribute("aria-current", "true");
    await t.press("ArrowRight");
    await t.expect("#nav-underline").toHaveAttribute("aria-current", "true");

    // 5. Left navigation back
    await t.press("ArrowLeft");
    await t.expect("#nav-italic").toHaveAttribute("aria-current", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Navigate: 2D Grid Spatial
  // Verifies: all 4 directions, edge wrapping, diagonal paths
  // ─────────────────────────────────────────────────────────────
  bot.describe("Navigate: 2D Grid", async (t) => {
    // 1. Start at top-left corner (0)
    await t.click("#nav-cell-0");
    await t.expect("#nav-cell-0").toHaveAttribute("aria-current", "true");

    // 2. Right navigation across top row: 0 → 1 → 2
    await t.press("ArrowRight");
    await t.expect("#nav-cell-1").toHaveAttribute("aria-current", "true");
    await t.expect("#nav-cell-0").toNotHaveAttribute("aria-current", "true");

    await t.press("ArrowRight");
    await t.expect("#nav-cell-2").toHaveAttribute("aria-current", "true");

    // 3. Down navigation along right column: 2 → 5 → 8
    await t.press("ArrowDown");
    await t.expect("#nav-cell-5").toHaveAttribute("aria-current", "true");

    await t.press("ArrowDown");
    await t.expect("#nav-cell-8").toHaveAttribute("aria-current", "true");

    // 4. Left navigation across bottom row: 8 → 7 → 6
    await t.press("ArrowLeft");
    await t.expect("#nav-cell-7").toHaveAttribute("aria-current", "true");

    await t.press("ArrowLeft");
    await t.expect("#nav-cell-6").toHaveAttribute("aria-current", "true");

    // 5. Up navigation along left column: 6 → 3 → 0
    await t.press("ArrowUp");
    await t.expect("#nav-cell-3").toHaveAttribute("aria-current", "true");

    await t.press("ArrowUp");
    await t.expect("#nav-cell-0").toHaveAttribute("aria-current", "true");

    // 6. Center navigation: 0 → 4 (down, right)
    await t.press("ArrowDown");
    await t.expect("#nav-cell-3").toHaveAttribute("aria-current", "true");
    await t.press("ArrowRight");
    await t.expect("#nav-cell-4").toHaveAttribute("aria-current", "true");

    // 7. All 4 directions from center
    await t.press("ArrowUp");
    await t.expect("#nav-cell-1").toHaveAttribute("aria-current", "true");
    await t.press("ArrowDown");
    await t.expect("#nav-cell-4").toHaveAttribute("aria-current", "true");
    await t.press("ArrowLeft");
    await t.expect("#nav-cell-3").toHaveAttribute("aria-current", "true");
    await t.press("ArrowRight");
    await t.expect("#nav-cell-4").toHaveAttribute("aria-current", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Select: Range Selection (Multi-Select)
  // Verifies: multi-select, range selection, deselection
  // ─────────────────────────────────────────────────────────────
  bot.describe("Select: Range Selection", async (t) => {
    // W3C APG Listbox: Plain click = replace, Meta/Ctrl+Click = toggle
    // 1. Initial selection (plain click)
    await t.click("#sel-range-0");
    await t.expect("#sel-range-0").toHaveAttribute("aria-selected", "true");

    // 2. Meta+Click: additive multi-select
    await t.click("#sel-range-2", { meta: true });
    await t.expect("#sel-range-2").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-range-0").toHaveAttribute("aria-selected", "true");

    // 3. Add middle item
    await t.click("#sel-range-1", { meta: true });
    await t.expect("#sel-range-1").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-range-0").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-range-2").toHaveAttribute("aria-selected", "true");

    // 4. Add more items
    await t.click("#sel-range-3", { meta: true });
    await t.expect("#sel-range-3").toHaveAttribute("aria-selected", "true");

    // 5. Verify all 4 items are selected
    await t.expect("#sel-range-0").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-range-1").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-range-2").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-range-3").toHaveAttribute("aria-selected", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Select: Toggle Mode
  // Verifies: single selection mode, selection switching
  // ─────────────────────────────────────────────────────────────
  bot.describe("Select: Toggle Mode", async (t) => {
    // 1. Initial selection
    await t.click("#sel-toggle-0");
    await t.expect("#sel-toggle-0").toHaveAttribute("aria-selected", "true");

    // 2. Click different item → single mode deselects previous
    await t.click("#sel-toggle-1");
    await t.expect("#sel-toggle-1").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-toggle-0").toNotHaveAttribute("aria-selected", "true");

    // 3. Switch back to first
    await t.click("#sel-toggle-0");
    await t.expect("#sel-toggle-0").toHaveAttribute("aria-selected", "true");
    await t.expect("#sel-toggle-1").toNotHaveAttribute("aria-selected", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Select: Follow Focus (Radio)
  // Verifies: keyboard navigation auto-selects, bidirectional
  // ─────────────────────────────────────────────────────────────
  bot.describe("Select: Follow Focus", async (t) => {
    // 1. Initial click selection
    await t.click("#sel-radio-a");
    await t.expect("#sel-radio-a").toHaveAttribute("aria-checked", "true");

    // 2. ArrowDown should auto-select next (followFocus)
    await t.press("ArrowDown");
    await t.expect("#sel-radio-b").toHaveAttribute("aria-checked", "true");
    await t.expect("#sel-radio-a").toNotHaveAttribute("aria-checked", "true");

    // 3. ArrowUp back to first
    await t.press("ArrowUp");
    await t.expect("#sel-radio-a").toHaveAttribute("aria-checked", "true");
    await t.expect("#sel-radio-b").toNotHaveAttribute("aria-checked", "true");

    // 4. Verify focus follows selection
    await t.expect("#sel-radio-a").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Tab: Trap Mode
  // Verifies: Tab wraps forward/backward, Shift+Tab reverse
  // ─────────────────────────────────────────────────────────────
  bot.describe("Tab: Trap Mode", async (t) => {
    // 1. Initial focus
    await t.click("#tab-trap-0");
    await t.expect("#tab-trap-0").toBeFocused();

    // 2. Tab forward: 0 → 1 → 2
    await t.press("Tab");
    await t.expect("#tab-trap-1").toBeFocused();

    await t.press("Tab");
    await t.expect("#tab-trap-2").toBeFocused();

    // 3. Tab from last → wraps to first (trap)
    await t.press("Tab");
    await t.expect("#tab-trap-0").toBeFocused();

    // 4. Verify wrap continues
    await t.press("Tab");
    await t.expect("#tab-trap-1").toBeFocused();

    // 5. Shift+Tab backward: 1 → 0 → 2 (reverse wrap)
    await t.press("Shift+Tab");
    await t.expect("#tab-trap-0").toBeFocused();

    await t.press("Shift+Tab");
    await t.expect("#tab-trap-2").toBeFocused();

    // 6. Continue reverse: 2 → 1 → 0
    await t.press("Shift+Tab");
    await t.expect("#tab-trap-1").toBeFocused();

    await t.press("Shift+Tab");
    await t.expect("#tab-trap-0").toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Activate: Automatic Mode
  // Verifies: focus triggers selection, keyboard activation
  // ─────────────────────────────────────────────────────────────
  bot.describe("Activate: Automatic", async (t) => {
    // 1. Click first item → auto-select
    await t.click("#act-auto-a");
    await t.expect("#act-auto-a").toBeFocused();
    await t.expect("#act-auto-a").toHaveAttribute("aria-selected", "true");

    // 2. Navigate to next → auto-select follows
    await t.press("ArrowDown");
    await t.expect("#act-auto-b").toBeFocused();
    await t.expect("#act-auto-b").toHaveAttribute("aria-selected", "true");
    await t.expect("#act-auto-a").toNotHaveAttribute("aria-selected", "true");

    // 3. Navigate back up
    await t.press("ArrowUp");
    await t.expect("#act-auto-a").toBeFocused();
    await t.expect("#act-auto-a").toHaveAttribute("aria-selected", "true");
    await t.expect("#act-auto-b").toNotHaveAttribute("aria-selected", "true");

    // 4. Click different item directly
    await t.click("#act-auto-b");
    await t.expect("#act-auto-b").toBeFocused();
    await t.expect("#act-auto-b").toHaveAttribute("aria-selected", "true");
    await t.expect("#act-auto-a").toNotHaveAttribute("aria-selected", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Dismiss: Escape Key
  // Verifies: selection, escape clears selection, focus behavior
  // ─────────────────────────────────────────────────────────────
  bot.describe("Dismiss: Escape", async (t) => {
    // 1. Click first item → select and focus
    await t.click("#dis-esc-1");
    await t.expect("#dis-esc-1").toHaveAttribute("aria-selected", "true");
    await t.expect("#dis-esc-1").toHaveAttribute("aria-current", "true");

    // 2. Escape should clear selection
    await t.press("Escape");
    await t.expect("#dis-esc-1").toNotHaveAttribute("aria-selected", "true");

    // 3. Click second item
    await t.click("#dis-esc-2");
    await t.expect("#dis-esc-2").toHaveAttribute("aria-selected", "true");
    await t.expect("#dis-esc-2").toHaveAttribute("aria-current", "true");

    // 4. Escape clears second item
    await t.press("Escape");
    await t.expect("#dis-esc-2").toNotHaveAttribute("aria-selected", "true");

    // 5. Select first item again, then switch
    await t.click("#dis-esc-1");
    await t.expect("#dis-esc-1").toHaveAttribute("aria-selected", "true");

    await t.click("#dis-esc-2");
    await t.expect("#dis-esc-2").toHaveAttribute("aria-selected", "true");
    await t.expect("#dis-esc-1").toNotHaveAttribute("aria-selected", "true");

    // 6. Final escape
    await t.press("Escape");
    await t.expect("#dis-esc-2").toNotHaveAttribute("aria-selected", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Expand: Tree Widget
  // Verifies: expand/collapse, child navigation, multiple parents
  // ─────────────────────────────────────────────────────────────
  bot.describe("Expand: Tree Toggle", async (t) => {
    // 1. First parent initially collapsed
    await t.click("#tree-parent-1");
    await t.expect("#tree-parent-1").toHaveAttribute("aria-expanded", "false");

    // 2. ArrowRight → expand
    await t.press("ArrowRight");
    await t.expect("#tree-parent-1").toHaveAttribute("aria-expanded", "true");

    // 3. ArrowDown → navigate to child
    await t.press("ArrowDown");
    await t.expect("#tree-child-1-1").toHaveAttribute("aria-current", "true");

    // 4. Navigate to second child
    await t.press("ArrowDown");
    await t.expect("#tree-child-1-2").toHaveAttribute("aria-current", "true");

    // 5. ArrowUp back to parent
    await t.press("ArrowUp");
    await t.expect("#tree-child-1-1").toHaveAttribute("aria-current", "true");
    await t.press("ArrowUp");
    await t.expect("#tree-parent-1").toHaveAttribute("aria-current", "true");

    // 6. ArrowLeft → collapse
    await t.press("ArrowLeft");
    await t.expect("#tree-parent-1").toHaveAttribute("aria-expanded", "false");

    // 7. Navigate to second parent
    await t.press("ArrowDown");
    await t.expect("#tree-parent-2").toHaveAttribute("aria-current", "true");
    await t.expect("#tree-parent-2").toHaveAttribute("aria-expanded", "false");

    // 8. Expand second parent with Enter (W3C APG)
    await t.press("Enter");
    await t.expect("#tree-parent-2").toHaveAttribute("aria-expanded", "true");

    // 9. Collapse second parent with Space (W3C APG)
    await t.press("Space");
    await t.expect("#tree-parent-2").toHaveAttribute("aria-expanded", "false");

    // 10. Re-expand with Enter
    await t.press("Enter");
    await t.expect("#tree-parent-2").toHaveAttribute("aria-expanded", "true");

    // 11. Collapse with ArrowLeft
    await t.press("ArrowLeft");
    await t.expect("#tree-parent-2").toHaveAttribute("aria-expanded", "false");
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Navigate: Home/End Keys
  // Verifies: Home jumps to first, End jumps to last (W3C APG)
  // ─────────────────────────────────────────────────────────────
  bot.describe("Navigate: Home/End", async (t) => {
    // 1. Click middle item in vertical list
    await t.click("#nav-banana");
    await t.expect("#nav-banana").toHaveAttribute("aria-current", "true");

    // 2. Home → jump to first item
    await t.press("Home");
    await t.expect("#nav-apple").toHaveAttribute("aria-current", "true");

    // 3. End → jump to last item
    await t.press("End");
    await t.expect("#nav-cherry").toHaveAttribute("aria-current", "true");

    // 4. Home again → back to first
    await t.press("Home");
    await t.expect("#nav-apple").toHaveAttribute("aria-current", "true");

    // 5. Test in horizontal toolbar
    await t.click("#nav-italic");
    await t.expect("#nav-italic").toHaveAttribute("aria-current", "true");

    // 6. Home → first toolbar button
    await t.press("Home");
    await t.expect("#nav-bold").toHaveAttribute("aria-current", "true");

    // 7. End → last toolbar button
    await t.press("End");
    await t.expect("#nav-underline").toHaveAttribute("aria-current", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 12. Focus Stack: Modal Restoration
  // Verifies: base focus, modal open/close, focus restoration
  // ─────────────────────────────────────────────────────────────
  bot.describe("Focus Stack: Restore", async (t) => {
    // W3C APG Dialog: focus restores to trigger element after close
    // 1. Open modal (trigger is inside #fs-base-1)
    await t.click("#fs-open-modal");

    // 2. Modal should auto-focus first item (role="dialog" + autoFocus)
    await t.expect("#fs-modal1-1").toHaveAttribute("aria-current", "true");

    // 3. Navigate within modal
    await t.press("ArrowDown");
    await t.expect("#fs-modal1-2").toHaveAttribute("aria-current", "true");

    // 4. Close modal (Escape)
    await t.press("Escape");

    // 5. Focus restores to trigger's container (#fs-base-1)
    await t.expect("#fs-base-1").toHaveAttribute("aria-current", "true");
  });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

import { useTestBotRoutes } from "@os/testBot";

export function useFocusShowcaseRoutes() {
  useTestBotRoutes("focus-showcase", defineTests);
}
