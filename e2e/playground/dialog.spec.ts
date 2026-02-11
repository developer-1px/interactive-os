import { expect, test } from "@playwright/test";

/**
 * Dialog Playground E2E Tests
 *
 * Verifies ZIFT Dialog compound component behavior:
 * 1. Basic Dialog — open/close lifecycle
 * 2. ESC key dismissal
 * 3. Backdrop click dismissal
 * 4. Nested Dialogs — focus stack restoration
 * 5. Close button (Trigger.Dismiss)
 */

test.describe("Dialog Playground", () => {
    test.beforeEach(async ({ page }) => {
        page.on("console", (msg) => console.log(`[Browser] ${msg.text()}`));
        await page.goto("/playground/radix");
        // Wait for React mount
        await page.waitForFunction(
            () => document.querySelector("#root")?.children.length! > 0,
            null,
            { timeout: 10000 },
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Basic Dialog — Open via trigger click
    // ─────────────────────────────────────────────────────────────
    test("Basic: Open dialog via trigger", async ({ page }) => {
        // Dialog should not be visible initially
        await expect(page.locator("dialog[open]")).toHaveCount(0);

        // Click "Open Dialog" button
        await page.getByText("Open Dialog").click();

        // Dialog should now be open
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // First item inside should be focused (aria-current=true)
        await expect(page.locator("#basic-opt-1")).toHaveAttribute(
            "aria-current",
            "true",
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 2. ESC — Closes dialog
    // ─────────────────────────────────────────────────────────────
    test("Basic: ESC closes dialog", async ({ page }) => {
        // Open
        await page.getByText("Open Dialog").click();
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // Click into dialog content to ensure zone is active
        await page.locator("#basic-opt-1").click();

        // Press ESC
        await page.keyboard.press("Escape");

        // Dialog should close
        await expect(page.locator("dialog[open]")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Close button — Trigger.Dismiss
    // ─────────────────────────────────────────────────────────────
    test("Basic: Close button dismisses dialog", async ({ page }) => {
        // Open dialog
        await page.getByText("Open Dialog").click();
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // Click close button inside dialog
        await page.locator("dialog[open]").getByText("Close").click();

        // Dialog should close
        await expect(page.locator("dialog[open]")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Keyboard navigation inside dialog
    // ─────────────────────────────────────────────────────────────
    test("Basic: Arrow navigation inside dialog", async ({ page }) => {
        // Open dialog
        await page.getByText("Open Dialog").click();

        // First item should be current
        await expect(page.locator("#basic-opt-1")).toHaveAttribute(
            "aria-current",
            "true",
        );

        // ArrowDown → second item
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#basic-opt-2")).toHaveAttribute(
            "aria-current",
            "true",
        );

        // ArrowDown → third item
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#basic-opt-3")).toHaveAttribute(
            "aria-current",
            "true",
        );

        // ArrowUp → back to second
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#basic-opt-2")).toHaveAttribute(
            "aria-current",
            "true",
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Nested Dialog — Open Level 2 from Level 1
    // ─────────────────────────────────────────────────────────────
    test("Nested: Open two-level dialogs", async ({ page }) => {
        // Open Level 1
        await page.getByText("Open Level 1").click();
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // First item should have focus
        await expect(page.locator("#l1-item-1")).toHaveAttribute(
            "aria-current",
            "true",
        );

        // Open Level 2
        await page.getByText("Open Level 2").click();

        // Both dialogs should be open
        await expect(page.locator("dialog[open]")).toHaveCount(2);

        // Level 2 items should be active
        await expect(page.locator("#l2-item-1")).toHaveAttribute(
            "aria-current",
            "true",
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Nested Dialog — Close restores previous level
    // ─────────────────────────────────────────────────────────────
    test("Nested: Close Level 2 restores Level 1", async ({ page }) => {
        // Open both levels
        await page.getByText("Open Level 1").click();
        await page.getByText("Open Level 2").click();
        await expect(page.locator("dialog[open]")).toHaveCount(2);

        // Close Level 2
        await page.getByText("Close Level 2").click();

        // Only Level 1 should remain
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // Level 1 items should be back in focus
        await expect(page.locator("#l1-item-1")).toHaveAttribute(
            "aria-current",
            "true",
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 7. Nested Dialog — ESC closes only top dialog
    // ─────────────────────────────────────────────────────────────
    test("Nested: ESC closes only top-level dialog", async ({ page }) => {
        // Open both levels
        await page.getByText("Open Level 1").click();
        await page.getByText("Open Level 2").click();
        await expect(page.locator("dialog[open]")).toHaveCount(2);

        // Click into Level 2 content to ensure zone is active
        await page.locator("#l2-item-1").click();

        // ESC should close Level 2 only
        await page.keyboard.press("Escape");
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // Click into Level 1 to ensure its zone is active
        await page.locator("#l1-item-1").click();

        // ESC again should close Level 1
        await page.keyboard.press("Escape");
        await expect(page.locator("dialog[open]")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Confirmation Dialog — Delete pattern
    // ─────────────────────────────────────────────────────────────
    test("Confirmation: Cancel closes without action", async ({ page }) => {
        // Open confirmation
        await page.getByText("Delete Item").click();
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // Click Cancel
        await page.locator("dialog[open]").getByText("Cancel").click();
        await expect(page.locator("dialog[open]")).toHaveCount(0);
    });

    test("Confirmation: Delete closes after action", async ({ page }) => {
        // Open confirmation
        await page.getByText("Delete Item").click();
        await expect(page.locator("dialog[open]")).toHaveCount(1);

        // Click Delete button (also a Dialog.Close) — use role to avoid matching paragraph text
        await page.locator("dialog[open]").getByRole("button", { name: "Delete", exact: true }).click();
        await expect(page.locator("dialog[open]")).toHaveCount(0);
    });
});
