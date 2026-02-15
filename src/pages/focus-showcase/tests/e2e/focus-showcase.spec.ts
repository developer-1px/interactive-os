import { expect, test } from "@playwright/test";

test.describe("Focus Showcase", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));
    await page.goto("/playground/focus");
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Autofocus: Entry Focus Strategies
  // ─────────────────────────────────────────────────────────────
  test("Autofocus: Entry Focus", async ({ page }) => {
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
  // 2. Navigate: Vertical List (Loop)
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Vertical Loop", async ({ page }) => {
    await page.locator("#nav-apple").click();
    await expect(page.locator("#nav-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#nav-cherry")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#nav-apple")).not.toHaveAttribute(
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
  // 3. Navigate: Horizontal Toolbar (Clamped)
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Horizontal Clamped", async ({ page }) => {
    await page.locator("#nav-bold").click();
    await expect(page.locator("#nav-bold")).toHaveAttribute(
      "aria-current",
      "true",
    );

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

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#nav-italic")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Navigate: 2D Grid Spatial
  // ─────────────────────────────────────────────────────────────
  test("Navigate: 2D Grid", async ({ page }) => {
    await page.locator("#nav-cell-0").click();
    await expect(page.locator("#nav-cell-0")).toHaveAttribute(
      "aria-current",
      "true",
    );

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
  // 5. Select: Range Selection (Multi-Select)
  // ─────────────────────────────────────────────────────────────
  test("Select: Range Selection", async ({ page }) => {
    await page.locator("#sel-range-0").click();
    await expect(page.locator("#sel-range-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

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

    await page.locator("#sel-range-3").click({ modifiers: ["Meta"] });
    await expect(page.locator("#sel-range-3")).toHaveAttribute(
      "aria-selected",
      "true",
    );

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
  // 6. Select: Toggle Mode
  // ─────────────────────────────────────────────────────────────
  test("Select: Toggle Mode", async ({ page }) => {
    await page.locator("#sel-toggle-0").click();
    await expect(page.locator("#sel-toggle-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.locator("#sel-toggle-1").click();
    await expect(page.locator("#sel-toggle-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#sel-toggle-0")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );

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
  // 7. Select: Follow Focus (Radio)
  // ─────────────────────────────────────────────────────────────
  test("Select: Follow Focus", async ({ page }) => {
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

    await expect(page.locator("#sel-radio-a")).toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Tab: Trap Mode
  // ─────────────────────────────────────────────────────────────
  test("Tab: Trap Mode", async ({ page }) => {
    await page.locator("#tab-trap-0").click();
    await expect(page.locator("#tab-trap-0")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-1")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-2")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-0")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-trap-1")).toBeFocused();

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
  // 8b. Tab: Escape Mode — Tab exits zone immediately
  // ─────────────────────────────────────────────────────────────
  test("Tab: Escape Mode", async ({ page }) => {
    // Focus the first item in escape group
    await page.locator("#tab-escape-0").click();
    await expect(page.locator("#tab-escape-0")).toBeFocused();

    // Tab should exit the zone — focus should NOT be on any item in this group
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-escape-0")).not.toBeFocused();
    await expect(page.locator("#tab-escape-1")).not.toBeFocused();
    await expect(page.locator("#tab-escape-2")).not.toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 8c. Tab: Flow Mode — Tab navigates internally, escapes at boundary
  // ─────────────────────────────────────────────────────────────
  test("Tab: Flow Mode", async ({ page }) => {
    // Focus the first item in flow group
    await page.locator("#tab-flow-0").click();
    await expect(page.locator("#tab-flow-0")).toBeFocused();

    // Tab moves to next item in the group
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-flow-1")).toBeFocused();

    // Tab moves to the last item
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-flow-2")).toBeFocused();

    // Tab at boundary should escape — no item in this group focused
    await page.keyboard.press("Tab");
    await expect(page.locator("#tab-flow-0")).not.toBeFocused();
    await expect(page.locator("#tab-flow-1")).not.toBeFocused();
    await expect(page.locator("#tab-flow-2")).not.toBeFocused();
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Activate: Automatic Mode
  // ─────────────────────────────────────────────────────────────
  test("Activate: Automatic", async ({ page }) => {
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
  // 10. Dismiss: Escape Key
  // ─────────────────────────────────────────────────────────────
  test("Dismiss: Escape", async ({ page }) => {
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
  // 11. Expand: Tree Widget
  // ─────────────────────────────────────────────────────────────
  test("Expand: Tree Toggle", async ({ page }) => {
    await page.locator("#tree-parent-1").click();
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

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

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tree-parent-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await page.keyboard.press("Enter");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("Space");
    await expect(page.locator("#tree-parent-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

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
  // 12. Navigate: Home/End Keys
  // ─────────────────────────────────────────────────────────────
  test("Navigate: Home/End", async ({ page }) => {
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
  // 13. Focus Stack: Modal Restoration
  // ─────────────────────────────────────────────────────────────
  test("Focus Stack: Restore", async ({ page }) => {
    await page.locator("#fs-open-modal").click();

    await expect(page.locator("#fs-modal1-1")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#fs-modal1-2")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("Escape");

    await expect(page.locator("#fs-base-1")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
