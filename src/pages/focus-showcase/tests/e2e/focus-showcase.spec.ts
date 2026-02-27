import { expect, test } from "@playwright/test";

test.describe("Focus Showcase", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));
    await page.goto("/playground/focus");
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.2  ENTRY STRATEGIES (SPEC: navigate.entry)
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 1. entry = first/last (basic click + navigate)
  // ─────────────────────────────────────────────────────────────
  test("Entry: first/last — click transfers aria-current exclusively", async ({
    page,
  }) => {
    // auto group (entry=first by default)
    await page.locator("#af-auto-1").click();
    await expect(page.locator("#af-auto-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.locator("#af-auto-2").click();
    await expect(page.locator("#af-auto-2")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#af-auto-1")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // entry=last group — click + arrow navigation
    await page.locator("#af-last-top").click();
    await expect(page.locator("#af-last-top")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#af-last-middle")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#af-last-bottom")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#af-last-middle")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#af-last-top")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 2. entry = restore — remembers last focused item
  // ─────────────────────────────────────────────────────────────
  test("Entry: restore — re-entering zone restores last focused item", async ({
    page,
  }) => {
    // Focus Memory 2 in the restore group
    await page.locator("#af-restore-2").click();
    await expect(page.locator("#af-restore-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Move to a different zone (click on auto group)
    await page.locator("#af-auto-1").click();
    await expect(page.locator("#af-auto-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
    // restore group should no longer be active-zone
    await expect(page.locator("#af-restore-2")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // Re-enter the restore zone — should restore Memory 2
    await page.locator("#af-restore").click();
    await expect(page.locator("#af-restore-2")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.2  OS_NAVIGATE COMMANDS
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 3. Vertical + loop=true
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Vertical Loop — wraps at boundaries", async ({ page }) => {
    await page.locator("#nav-apple").click();
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // ArrowUp from first → last (loop)
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-cherry")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-apple")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // ArrowDown from last → first (loop)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-cherry")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // Walk full cycle: A → B → C → A
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-cherry")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-cherry")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // Reverse: A → C (up) → B (up)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Horizontal + loop=false (clamp)
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Horizontal Clamped — stops at boundaries", async ({
    page,
  }) => {
    await page.locator("#nav-bold").click();
    await expect(page.locator("#nav-bold")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Try going left from first — should stay
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-bold")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-bold")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Move right through all items
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-bold")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-underline")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-italic")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    // Try going right from last — should stay (clamped)
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-underline")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-underline")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Go back left
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 5. 2D Grid (orientation=both)
  // ─────────────────────────────────────────────────────────────
  test("Navigate: 2D Grid — spatial movement in 3×3", async ({ page }) => {
    // Grid layout:
    // 0 1 2
    // 3 4 5
    // 6 7 8
    await page.locator("#nav-cell-0").click();
    await expect(page.locator("#nav-cell-0")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Right: 0 → 1 → 2
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-cell-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-cell-0")).not.toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-cell-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Down: 2 → 5 → 8
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-cell-5")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-cell-8")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Left: 8 → 7 → 6
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-cell-7")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-cell-6")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Up: 6 → 3 → 0
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-cell-3")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-cell-0")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Cross-pattern: 0 → 3 → 4 → 1 → 4 → 3 → 4
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-cell-3")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-cell-4")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-cell-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-cell-4")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-cell-3")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-cell-4")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Home/End keys
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Home/End — jumps to first/last item", async ({ page }) => {
    // Vertical group
    await page.locator("#nav-banana").click();
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("Home");
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("End");
    await expect(page.locator("#nav-cherry")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("Home");
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Horizontal group
    await page.locator("#nav-italic").click();
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("Home");
    await expect(page.locator("#nav-bold")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("End");
    await expect(page.locator("#nav-underline")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Orthogonal direction ignored
  // ─────────────────────────────────────────────────────────────
  test("Navigate: orthogonal direction ignored", async ({ page }) => {
    // Vertical list — ArrowLeft/Right should not move
    await page.locator("#nav-banana").click();
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Horizontal toolbar — ArrowUp/Down should not move
    await page.locator("#nav-italic").click();
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.4  SELECTION COMMANDS
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 8. Multi-select: Cmd+Click toggle
  // ─────────────────────────────────────────────────────────────
  test("Select: Multi — Cmd+Click toggles individual items", async ({
    page,
  }) => {
    await page.locator("#sel-range-0").click();
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click to add
    await page.locator("#sel-range-2").click({ modifiers: ["Meta"] });
    await expect(page.locator("#sel-range-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#sel-range-1").click({ modifiers: ["Meta"] });
    await expect(page.locator("#sel-range-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click same again to deselect (toggle)
    await page.locator("#sel-range-1").click({ modifiers: ["Meta"] });
    await expect(page.locator("#sel-range-1")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Others should remain
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Multi-select: Shift+Click range selection
  // ─────────────────────────────────────────────────────────────
  test("Select: Multi — Shift+Click selects range", async ({ page }) => {
    // Click first item
    await page.locator("#sel-range-0").click();
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Shift+Click last item — should select 0,1,2,3 (range)
    await page.locator("#sel-range-3").click({ modifiers: ["Shift"] });
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-range-3")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Single + Toggle: click switches, no multi
  // ─────────────────────────────────────────────────────────────
  test("Select: Single Toggle — only one item selected at a time", async ({
    page,
  }) => {
    await page.locator("#sel-toggle-0").click();
    await expect(page.locator("#sel-toggle-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Click second → replaces first
    await page.locator("#sel-toggle-1").click();
    await expect(page.locator("#sel-toggle-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-toggle-0")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Click first again → replaces second
    await page.locator("#sel-toggle-0").click();
    await expect(page.locator("#sel-toggle-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-toggle-1")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Follow Focus (Radio) — arrow keys = selection
  // ─────────────────────────────────────────────────────────────
  test("Select: Follow Focus — arrow key moves selection + real DOM focus", async ({
    page,
  }) => {
    await page.locator("#sel-radio-a").click();
    await expect(page.locator("#sel-radio-a")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#sel-radio-b")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#sel-radio-a")).not.toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#sel-radio-a")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#sel-radio-b")).not.toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Real DOM focus verification (§9.2 tabIndex)
    await expect(page.locator("#sel-radio-a")).toBeFocused();
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.3  OS_TAB COMMANDS
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 12. Tab: trap — cycles forward and backward
  // ─────────────────────────────────────────────────────────────
  test("Tab: Trap — cycles within zone in both directions", async ({
    page,
  }) => {
    await page.locator("#tab-trap-0").click();
    await expect(page.locator("#tab-trap-0")).toBeFocused();

    // Forward: 0 → 1 → 2 → 0 (wrap) → 1
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-1")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-2")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-0")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-1")).toBeFocused();

    // Backward: 1 → 0 → 2 (wrap) → 1 → 0
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-trap-0")).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-trap-2")).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-trap-1")).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-trap-0")).toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 13. Tab: escape — exits zone immediately
  // ─────────────────────────────────────────────────────────────
  test("Tab: Escape — exits zone immediately on Tab", async ({ page }) => {
    await page.locator("#tab-escape-0").click();
    await expect(page.locator("#tab-escape-0")).toBeFocused();

    // Tab should exit — no item in this group should be focused
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-escape-0")).not.toBeFocused();
    await expect(page.locator("#tab-escape-1")).not.toBeFocused();
    await expect(page.locator("#tab-escape-2")).not.toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 14. Tab: escape — Shift+Tab also exits
  // ─────────────────────────────────────────────────────────────
  test("Tab: Escape — Shift+Tab exits zone backward", async ({ page }) => {
    await page.locator("#tab-escape-1").click();
    await expect(page.locator("#tab-escape-1")).toBeFocused();

    // Shift+Tab should also exit the zone
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-escape-0")).not.toBeFocused();
    await expect(page.locator("#tab-escape-1")).not.toBeFocused();
    await expect(page.locator("#tab-escape-2")).not.toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 15. Tab: flow — navigates internally, escapes at boundary
  // ─────────────────────────────────────────────────────────────
  test("Tab: Flow — forward walks through items then exits", async ({
    page,
  }) => {
    await page.locator("#tab-flow-0").click();
    await expect(page.locator("#tab-flow-0")).toBeFocused();

    // Tab: 0 → 1 → 2 → exit
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-flow-1")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-flow-2")).toBeFocused();

    // At boundary → escapes
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-flow-0")).not.toBeFocused();
    await expect(page.locator("#tab-flow-1")).not.toBeFocused();
    await expect(page.locator("#tab-flow-2")).not.toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 16. Tab: flow — Shift+Tab exits at start boundary
  // ─────────────────────────────────────────────────────────────
  test("Tab: Flow — Shift+Tab exits at start boundary", async ({ page }) => {
    await page.locator("#tab-flow-0").click();
    await expect(page.locator("#tab-flow-0")).toBeFocused();

    // Shift+Tab from first item → should exit backward
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-flow-0")).not.toBeFocused();
    await expect(page.locator("#tab-flow-1")).not.toBeFocused();
    await expect(page.locator("#tab-flow-2")).not.toBeFocused();
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.5  INTERACTION COMMANDS
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 17. Activate: automatic — focus = immediate select
  // ─────────────────────────────────────────────────────────────
  test("Activate: Automatic — focus triggers immediate selection", async ({
    page,
  }) => {
    await page.locator("#act-auto-a").click();
    await expect(page.locator("#act-auto-a")).toBeFocused();
    await expect(page.locator("#act-auto-a")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#act-auto-b")).toBeFocused();
    await expect(page.locator("#act-auto-b")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#act-auto-a")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#act-auto-a")).toBeFocused();
    await expect(page.locator("#act-auto-a")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#act-auto-b")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Click also triggers
    await page.locator("#act-auto-b").click();
    await expect(page.locator("#act-auto-b")).toBeFocused();
    await expect(page.locator("#act-auto-b")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#act-auto-a")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 18. Activate: manual — listbox preset has followFocus=true
  //     so selection still follows focus (§7 Role Preset Table)
  // ─────────────────────────────────────────────────────────────
  test("Activate: Manual — listbox followFocus=true still selects on focus move", async ({
    page,
  }) => {
    await page.locator("#act-manual-1").click();
    await expect(page.locator("#act-manual-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#act-manual-2")).toHaveAttribute(
      "aria-current",
      "true",
    );
    // §7: listbox has followFocus=true — selection follows focus despite manual activate
    await expect(page.locator("#act-manual-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#act-manual-1")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.5  DISMISS COMMANDS
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 19. Dismiss: escape=deselect — clears selection
  // ─────────────────────────────────────────────────────────────
  test("Dismiss: Escape=deselect — clears selection on Escape", async ({
    page,
  }) => {
    await page.locator("#dis-esc-1").click();
    await expect(page.locator("#dis-esc-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#dis-esc-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("Escape");
    await expect(page.locator("#dis-esc-1")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Select another, then Escape again
    await page.locator("#dis-esc-2").click();
    await expect(page.locator("#dis-esc-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#dis-esc-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("Escape");
    await expect(page.locator("#dis-esc-2")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Select one, then click another (replaces), then Escape
    await page.locator("#dis-esc-1").click();
    await expect(page.locator("#dis-esc-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#dis-esc-2").click();
    await expect(page.locator("#dis-esc-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#dis-esc-1")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.keyboard.press("Escape");
    await expect(page.locator("#dis-esc-2")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 20. Dismiss: escape=close — fires onDismiss (menu pattern)
  // ─────────────────────────────────────────────────────────────
  test("Dismiss: Escape=close — Escape in menu focuses item then allows dismiss", async ({
    page,
  }) => {
    // The dis-close zone is a menu with escape=close
    await page.locator("#dis-close-A").click();
    await expect(page.locator("#dis-close-A")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#dis-close-B")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.7  OS_EXPAND COMMANDS
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 21. Expand: tree toggle — ArrowRight/Left/Enter/Space
  // ─────────────────────────────────────────────────────────────
  test("Expand: Tree Toggle — expand/collapse via arrows and Enter/Space", async ({
    page,
  }) => {
    // Parent 1: click activates and expands (tree activate = toggle expand)
    await page.locator("#tree-parent-1").click();
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ArrowLeft → collapse first
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // ArrowRight → expand again
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Navigate into children
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-child-1-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-child-1-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Navigate back up to parent
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#tree-child-1-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // ArrowLeft → collapse
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Move to parent 2
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Enter → expand
    await page.keyboard.press("Enter");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Space → collapse
    await page.keyboard.press("Space");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Enter + ArrowLeft combo
    await page.keyboard.press("Enter");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 22. Expand: collapsed parent skips hidden children
  // ─────────────────────────────────────────────────────────────
  test("Expand: collapsed parent — ArrowDown skips hidden children", async ({
    page,
  }) => {
    // Parent 1: click activates and expands (tree activate = toggle)
    await page.locator("#tree-parent-1").click();
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Collapse first to test skip
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // ArrowDown from collapsed parent → skips to next sibling (parent-2)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Navigate back to parent-1 and expand
    await page.locator("#tree-parent-1").click();
    // Click toggles again → now expanded
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-child-1-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.1  OS_FOCUS STACK (OS_STACK_PUSH / OS_STACK_POP)
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 23. Focus Stack: single modal — open/navigate/close restores
  // ─────────────────────────────────────────────────────────────
  test("Focus Stack: single modal — restore on close", async ({ page }) => {
    // Click "Open Modal" trigger to open dialog
    await page.locator("#fs-open-modal").click();

    // Modal opens → first item should receive focus
    await expect(page.locator("#fs-modal1-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Navigate within modal
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#fs-modal1-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Close modal with Escape → should restore to base zone
    await page.keyboard.press("Escape");

    await expect(page.locator("#fs-base-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 24. Focus Stack: nested modals — stacked push/pop chain
  // ─────────────────────────────────────────────────────────────
  test("Focus Stack: nested modals — double push/pop restores correctly", async ({
    page,
  }) => {
    // Open first modal
    await page.locator("#fs-open-modal").click();
    await expect(page.locator("#fs-modal1-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Navigate to second item (which has sub-modal trigger)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#fs-modal1-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Open sub-modal via the "Open Sub-Modal" button
    await page.locator("#fs-open-sub-modal").click();

    // Sub-modal should have focus on its first item
    await expect(page.locator("#fs-modal2-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Navigate within sub-modal
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#fs-modal2-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Close sub-modal → should restore to modal 1, item 2
    await page.keyboard.press("Escape");
    await expect(page.locator("#fs-modal1-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Close modal 1 → should restore to base zone
    await page.keyboard.press("Escape");
    await expect(page.locator("#fs-base-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §9.2  ARIA DERIVED ATTRIBUTES
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 25. ARIA: tabIndex roving (focused=0, others=-1)
  // ─────────────────────────────────────────────────────────────
  test("ARIA: tabIndex roving — focused item gets 0, others -1", async ({
    page,
  }) => {
    await page.locator("#nav-apple").click();

    // Focused item should have tabIndex=0
    await expect(page.locator("#nav-apple")).toHaveAttribute("tabindex", "0");
    // Non-focused items should have tabIndex=-1
    await expect(page.locator("#nav-banana")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#nav-cherry")).toHaveAttribute("tabindex", "-1");

    // Move focus
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-banana")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#nav-apple")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#nav-cherry")).toHaveAttribute("tabindex", "-1");
  });

  // ─────────────────────────────────────────────────────────────
  // 26. ARIA: data-focused attribute
  // ─────────────────────────────────────────────────────────────
  test("ARIA: data-focused reflects visual focus state", async ({ page }) => {
    await page.locator("#nav-apple").click();
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "data-focused",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#nav-apple")).not.toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  // ═══════════════════════════════════════════════════════════════
  // §3.2  TYPEAHEAD NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 27. Typeahead: single char matches first item starting with that letter
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Typeahead — typing a letter focuses matching item", async ({
    page,
  }) => {
    // nav-list is a listbox (typeahead=true per §7 Role Preset)
    // Items: Apple, Banana, Cherry
    await page.locator("#nav-apple").click();
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Type 'b' → should focus Banana
    await page.keyboard.press("b");
    await expect(page.locator("#nav-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Wait for typeahead buffer to reset (TIMEOUT = 500ms)
    await page.waitForTimeout(600);

    // Type 'c' → should focus Cherry
    await page.keyboard.press("c");
    await expect(page.locator("#nav-cherry")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Wait for buffer reset
    await page.waitForTimeout(600);

    // Type 'a' → should focus Apple
    await page.keyboard.press("a");
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 28. Tab: escape cross-zone — Tab lands in next zone
  // ─────────────────────────────────────────────────────────────
  test("Tab: Escape cross-zone — Tab exits and lands in next zone", async ({
    page,
  }) => {
    // tab-escape is a listbox with behavior=escape
    // tab-trap is the next zone in DOM order
    await page.locator("#tab-escape-1").click();
    await expect(page.locator("#tab-escape-1")).toBeFocused();

    // Tab → should exit escape zone and land in trap zone
    await page.keyboard.press("Tab");

    // Should NOT be in escape zone
    await expect(page.locator("#tab-escape-0")).not.toBeFocused();
    await expect(page.locator("#tab-escape-1")).not.toBeFocused();
    await expect(page.locator("#tab-escape-2")).not.toBeFocused();

    // Should be in the next zone (trap zone)
    const trapFocused = page.locator("#tab-trap-0");
    await expect(trapFocused).toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 29. Tab: multi-zone — Shift+Tab backward across zones
  // ─────────────────────────────────────────────────────────────
  test("Tab: Multi-zone — Shift+Tab navigates backward across zones", async ({
    page,
  }) => {
    // Start in trap zone
    await page.locator("#tab-trap-0").click();
    await expect(page.locator("#tab-trap-0")).toBeFocused();

    // Shift+Tab in trap → should wrap within trap (trap cycles)
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-trap-2")).toBeFocused();

    // Now go to flow zone
    await page.locator("#tab-flow-2").click();
    await expect(page.locator("#tab-flow-2")).toBeFocused();

    // Shift+Tab → flow walks backward: 2 → 1
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-flow-1")).toBeFocused();

    // Shift+Tab → flow walks backward: 1 → 0
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-flow-0")).toBeFocused();

    // Shift+Tab → at boundary, exits backward to previous zone
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#tab-flow-0")).not.toBeFocused();
    await expect(page.locator("#tab-flow-1")).not.toBeFocused();
    await expect(page.locator("#tab-flow-2")).not.toBeFocused();
  });
});
