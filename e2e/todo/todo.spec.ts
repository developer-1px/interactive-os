import { expect, test } from "@playwright/test";

/**
 * Todo App — Black-Box E2E Tests
 *
 * Pure Playwright. No internal imports, no kernel, no commands.
 * Tests interact exactly as a user would: keyboard & mouse only.
 *
 * Initial state:
 *   - 3 categories: Inbox (selected), Work, Personal
 *   - Inbox has 1 todo: "Complete Interaction OS docs"
 */

test.describe("Todo App", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/todo");
        await page.waitForFunction(
            () => document.querySelector("#root")?.children.length! > 0,
            null,
            { timeout: 10000 },
        );
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Navigation — Arrow keys within list
    // ─────────────────────────────────────────────────────────────

    test("Arrow navigation moves focus between items", async ({ page }) => {
        // Click on the list area to activate it
        await page.getByPlaceholder("Add a new task...").click();
        await expect(page.getByPlaceholder("Add a new task...")).toBeFocused();

        // ArrowDown from draft should move focus to the first todo item
        await page.keyboard.press("ArrowDown");

        const firstItem = page.locator('[role="listbox"]#listView [data-focused="true"]');
        await expect(firstItem).toHaveCount(1);
        await expect(firstItem).toContainText("Complete Interaction OS docs");
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Navigation — Tab between Sidebar and ListView
    // ─────────────────────────────────────────────────────────────

    test("Tab switches focus between Sidebar and ListView", async ({ page }) => {
        // Click on sidebar to activate it
        await page.getByText("Inbox").click();
        const sidebarItem = page.locator('[role="listbox"]#sidebar [data-focused="true"]');
        await expect(sidebarItem).toHaveCount(1);

        // Tab should move focus to ListView
        await page.keyboard.press("Tab");
        const listItem = page.locator('[role="listbox"]#listView [data-focused="true"]');
        await expect(listItem).toHaveCount(1);
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Creation — Type in draft + Enter
    // ─────────────────────────────────────────────────────────────

    test("Create todo via draft input", async ({ page }) => {
        const draft = page.getByPlaceholder("Add a new task...");
        await draft.click();
        await draft.fill("Buy milk");
        await page.keyboard.press("Enter");

        // New item should appear in the list
        await expect(page.getByText("Buy milk")).toBeVisible();

        // Draft should be cleared
        await expect(draft).toHaveValue("");
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Toggle — Space to check/uncheck
    // ─────────────────────────────────────────────────────────────

    test("Space toggles todo completion", async ({ page }) => {
        // Focus on the first item
        await page.getByPlaceholder("Add a new task...").click();
        await page.keyboard.press("ArrowDown");

        const focusedItem = page.locator('[role="listbox"]#listView [data-focused="true"]');
        await expect(focusedItem).toContainText("Complete Interaction OS docs");

        // Toggle: should become completed (line-through)
        await page.keyboard.press("Space");
        await expect(focusedItem.locator("span.line-through")).toHaveCount(1);

        // Toggle back: should remove line-through
        await page.keyboard.press("Space");
        await expect(focusedItem.locator("span.line-through")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Edit — Enter to start, type, Enter to save
    // ─────────────────────────────────────────────────────────────

    test("Edit todo: Enter → type → Enter saves", async ({ page }) => {
        // Focus on the item
        await page.getByPlaceholder("Add a new task...").click();
        await page.keyboard.press("ArrowDown");

        // Enter edit mode
        await page.keyboard.press("Enter");

        // Edit field should appear with current text
        const editField = page.locator('[role="listbox"]#listView input, [role="listbox"]#listView textarea').last();
        await expect(editField).toBeFocused();

        // Clear and type new text
        await editField.fill("Updated docs task");
        await page.keyboard.press("Enter");

        // Should save the new text
        await expect(page.getByText("Updated docs task")).toBeVisible();
        await expect(page.getByText("Complete Interaction OS docs")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Edit — Enter to start, type, Escape to cancel
    // ─────────────────────────────────────────────────────────────

    test("Edit todo: Enter → type → Escape cancels", async ({ page }) => {
        // Focus on the item
        await page.getByPlaceholder("Add a new task...").click();
        await page.keyboard.press("ArrowDown");

        // Enter edit mode
        await page.keyboard.press("Enter");

        const editField = page.locator('[role="listbox"]#listView input, [role="listbox"]#listView textarea').last();
        await expect(editField).toBeFocused();

        // Type something different
        await editField.fill("This should be discarded");
        await page.keyboard.press("Escape");

        // Original text should remain
        await expect(page.getByText("Complete Interaction OS docs")).toBeVisible();
        await expect(page.getByText("This should be discarded")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 7. Delete — Backspace removes item
    // ─────────────────────────────────────────────────────────────

    test("Backspace deletes focused todo", async ({ page }) => {
        // Create a second item first so we can verify focus recovery
        const draft = page.getByPlaceholder("Add a new task...");
        await draft.click();
        await draft.fill("Temporary task");
        await page.keyboard.press("Enter");

        await expect(page.getByText("Temporary task")).toBeVisible();

        // Navigate to the new item (should be at the end)
        await page.keyboard.press("ArrowDown"); // to first item
        await page.keyboard.press("ArrowDown"); // to second item

        const focusedItem = page.locator('[role="listbox"]#listView [data-focused="true"]');
        await expect(focusedItem).toContainText("Temporary task");

        // Delete it
        await page.keyboard.press("Backspace");

        // Item should be gone
        await expect(page.getByText("Temporary task")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Reorder — Meta+Arrow moves items
    // ─────────────────────────────────────────────────────────────

    test("Meta+Arrow reorders items", async ({ page }) => {
        // Create a second item
        const draft = page.getByPlaceholder("Add a new task...");
        await draft.click();
        await draft.fill("Second task");
        await page.keyboard.press("Enter");

        // Navigate to the second item
        await page.keyboard.press("ArrowDown"); // first
        await page.keyboard.press("ArrowDown"); // second

        const focusedItem = page.locator('[role="listbox"]#listView [data-focused="true"]');
        await expect(focusedItem).toContainText("Second task");

        // Move it up
        await page.keyboard.press("Meta+ArrowUp");

        // Verify order changed: "Second task" should now be before "Complete Interaction OS docs"
        const items = page.locator('[role="listbox"]#listView [data-item-id]');
        const texts = await items.allTextContents();
        const secondIdx = texts.findIndex((t) => t.includes("Second task"));
        const firstIdx = texts.findIndex((t) =>
            t.includes("Complete Interaction OS docs"),
        );
        expect(secondIdx).toBeLessThan(firstIdx);
    });

    // ─────────────────────────────────────────────────────────────
    // 9. Clipboard — Meta+C / Meta+V
    // ─────────────────────────────────────────────────────────────

    test("Meta+C then Meta+V duplicates item", async ({ page }) => {
        // Focus the item
        await page.getByPlaceholder("Add a new task...").click();
        await page.keyboard.press("ArrowDown");

        const focusedItem = page.locator('[role="listbox"]#listView [data-focused="true"]');
        await expect(focusedItem).toContainText("Complete Interaction OS docs");

        // Copy
        await page.keyboard.press("Meta+c");

        // Paste
        await page.keyboard.press("Meta+v");

        // Should now have two items with the same text
        const items = page.getByText("Complete Interaction OS docs");
        await expect(items).toHaveCount(2);
    });

    // ─────────────────────────────────────────────────────────────
    // 10. Sidebar — Click to switch category
    // ─────────────────────────────────────────────────────────────

    test("Click sidebar category switches list", async ({ page }) => {
        // Initially showing Inbox content
        await expect(page.getByText("Complete Interaction OS docs")).toBeVisible();

        // Click "Work" category
        await page.getByText("Work").click();

        // Should show Work todos
        await expect(page.getByText("Review Red Team feedback")).toBeVisible();
        await expect(page.getByText("Plan next iteration")).toBeVisible();

        // Inbox todo should not be visible
        await expect(page.getByText("Complete Interaction OS docs")).toHaveCount(0);
    });

    // ─────────────────────────────────────────────────────────────
    // 11. Sidebar — Keyboard category selection
    // ─────────────────────────────────────────────────────────────

    test("Sidebar keyboard navigation and selection", async ({ page }) => {
        // Click sidebar to activate
        await page.getByText("Inbox").click();

        // Navigate down to "Work"
        await page.keyboard.press("ArrowDown");
        const focusedCat = page.locator('[role="listbox"]#sidebar [data-focused="true"]');
        await expect(focusedCat).toContainText("Work");

        // Press Enter to select
        await page.keyboard.press("Enter");

        // Work todos should appear
        await expect(page.getByText("Review Red Team feedback")).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────
    // 12. Sidebar — Meta+Arrow reorders categories
    // ─────────────────────────────────────────────────────────────

    test("Sidebar Meta+Arrow reorders categories", async ({ page }) => {
        // Click sidebar to activate, focus on "Inbox"
        await page.getByText("Inbox").click();

        // Move Inbox down
        await page.keyboard.press("Meta+ArrowDown");

        // Verify order: Work should now be first
        const categories = page.locator('[role="listbox"]#sidebar [data-item-id]');
        const texts = await categories.allTextContents();
        const inboxIdx = texts.findIndex((t) => t.includes("Inbox"));
        const workIdx = texts.findIndex((t) => t.includes("Work"));
        expect(workIdx).toBeLessThan(inboxIdx);
    });
});
