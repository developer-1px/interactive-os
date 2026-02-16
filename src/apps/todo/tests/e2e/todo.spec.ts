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
 *
 * Architecture notes:
 *   - OS.Field renders as contenteditable div[role="textbox"] with data-placeholder
 *   - DRAFT field is mode="immediate" → always editable when focused
 *   - Todo items are OS.Item with numeric data-item-id
 *   - Edit field has id="EDIT" and mode="deferred"
 */

const DRAFT = '[data-placeholder="Add a new task..."]';
const LISTVIEW = '[role="listbox"]#list';
const SIDEBAR = '[role="listbox"]#sidebar';

/** Get the focused item in listView (excluding DRAFT) */
const focusedTodoItem = (listview: string) =>
  `${listview} [data-focused="true"]:not(#DRAFT)`;

test.describe("Todo App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(DRAFT, { timeout: 15000 });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Creation — Type in draft + Enter
  // ─────────────────────────────────────────────────────────────

  test("Create todo via draft input", async ({ page }) => {
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Buy milk");
    await page.keyboard.press("Enter");

    // New item should appear
    await expect(page.getByText("Buy milk")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Click todo item to focus
  // ─────────────────────────────────────────────────────────────

  test("Clicking a todo item focuses it", async ({ page }) => {
    await page.getByText("Complete Interaction OS docs").click();

    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toHaveCount(1);
    await expect(focused).toContainText("Complete Interaction OS docs");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Toggle — Space to check/uncheck
  // ─────────────────────────────────────────────────────────────

  test("Space toggles todo completion", async ({ page }) => {
    // Click on the todo item to focus it
    await page.getByText("Complete Interaction OS docs").click();

    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Complete Interaction OS docs");

    // Toggle: should become completed (line-through)
    await page.keyboard.press("Space");
    await expect(focused.locator("span.line-through")).toHaveCount(1);

    // Toggle back: should remove line-through
    await page.keyboard.press("Space");
    await expect(focused.locator("span.line-through")).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Edit — Enter to start, type, Enter to save
  // ─────────────────────────────────────────────────────────────

  test("Edit todo: Enter → type → Enter saves", async ({ page }) => {
    // Click on the todo item to focus it
    await page.getByText("Complete Interaction OS docs").click();

    // Enter edit mode (Enter = ACTIVATE = onAction = StartEdit)
    await page.keyboard.press("Enter");

    // Edit field should appear
    const editField = page.locator("#EDIT");
    await expect(editField).toBeVisible();

    // Select all and type new text
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Updated docs task");
    await page.keyboard.press("Enter");

    // Should save the new text
    await expect(page.getByText("Updated docs task")).toBeVisible();
    await expect(page.getByText("Complete Interaction OS docs")).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Edit — Enter to start, type, Escape to cancel
  // ─────────────────────────────────────────────────────────────

  test("Edit todo: Enter → type → Escape cancels", async ({ page }) => {
    await page.getByText("Complete Interaction OS docs").click();

    await page.keyboard.press("Enter");

    const editField = page.locator("#EDIT");
    await expect(editField).toBeVisible();

    await page.keyboard.press("Meta+a");
    await page.keyboard.type("This should be discarded");
    await page.keyboard.press("Escape");

    // Original text should remain
    await expect(page.getByText("Complete Interaction OS docs")).toBeVisible();
    await expect(page.getByText("This should be discarded")).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Delete — Backspace removes item
  // ─────────────────────────────────────────────────────────────

  test("Backspace deletes focused todo", async ({ page }) => {
    // Create a second item first
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Temporary task");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Temporary task")).toBeVisible();

    // Click on the item to focus it
    await page.getByText("Temporary task").click();
    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Temporary task");

    // Delete it
    await page.keyboard.press("Backspace");

    // Item should be gone
    await expect(page.getByText("Temporary task")).toHaveCount(0);
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Reorder — Meta+Arrow moves items
  // ─────────────────────────────────────────────────────────────

  test("Meta+Arrow reorders items", async ({ page }) => {
    // Create a second item
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Second task");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Second task")).toBeVisible();

    // Click the second item to focus it
    await page.getByText("Second task").click();
    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Second task");

    // Move it up
    await page.keyboard.press("Meta+ArrowUp");

    // Verify order changed
    const items = page.locator(`${LISTVIEW} [data-item-id]:not(#DRAFT)`);
    const texts = await items.allTextContents();
    const secondIdx = texts.findIndex((t) => t.includes("Second task"));
    const firstIdx = texts.findIndex((t) =>
      t.includes("Complete Interaction OS docs"),
    );
    expect(secondIdx).toBeLessThan(firstIdx);
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Arrow navigation between todo items
  // ─────────────────────────────────────────────────────────────

  test("Arrow navigation between todo items", async ({ page }) => {
    // Create a second item
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Second task");
    await page.keyboard.press("Enter");

    // Click first item to focus it
    await page.getByText("Complete Interaction OS docs").click();
    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Complete Interaction OS docs");

    // ArrowDown should move to second item
    await page.keyboard.press("ArrowDown");
    await expect(focused).toContainText("Second task");

    // ArrowUp should move back
    await page.keyboard.press("ArrowUp");
    await expect(focused).toContainText("Complete Interaction OS docs");
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Clipboard — Meta+C / Meta+V
  // ─────────────────────────────────────────────────────────────

  test("Meta+C then Meta+V duplicates item", async ({ page }) => {
    // Click the item to focus it
    await page.getByText("Complete Interaction OS docs").click();
    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Complete Interaction OS docs");

    // Copy then Paste
    await page.keyboard.press("Meta+c");
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
    await page.locator("#cat_work").click();

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
    // Click sidebar item to activate
    await page.locator("#cat_inbox").click();

    // Navigate down to "Work"
    await page.keyboard.press("ArrowDown");
    const focusedCat = page.locator(`${SIDEBAR} [data-focused="true"]`);
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
    // Click sidebar "Inbox" to activate and focus
    await page.locator("#cat_inbox").click();

    // Move Inbox down
    await page.keyboard.press("Meta+ArrowDown");

    // Verify order: Work should now be first
    const categories = page.locator(`${SIDEBAR} [data-item-id]`);
    const texts = await categories.allTextContents();
    const inboxIdx = texts.findIndex((t) => t.includes("Inbox"));
    const workIdx = texts.findIndex((t) => t.includes("Work"));
    expect(workIdx).toBeLessThan(inboxIdx);
  });

  // ─────────────────────────────────────────────────────────────
  // 13. Undo — Meta+Z restores deleted item (SC-2)
  // ─────────────────────────────────────────────────────────────

  test("Meta+Z undoes delete", async ({ page }) => {
    // Create an item to delete
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Undo target");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Undo target")).toBeVisible();

    // Click, focus, and delete
    await page.getByText("Undo target").click();
    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Undo target");
    await page.keyboard.press("Backspace");
    await expect(page.getByText("Undo target")).toHaveCount(0);

    // Undo → item should reappear
    await page.keyboard.press("Meta+z");
    await expect(page.getByText("Undo target")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 14. Cut + Paste — Meta+X → move → Meta+V (SC-3)
  // ─────────────────────────────────────────────────────────────

  test("Meta+X then Meta+V moves item", async ({ page }) => {
    // Use the pre-existing item + create one more
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Anchor item");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Anchor item")).toBeVisible();

    // Cut the pre-existing item
    await page.getByText("Complete Interaction OS docs").click();
    await page.keyboard.press("Meta+x");
    await expect(page.getByText("Complete Interaction OS docs")).toHaveCount(0);

    // Paste after "Anchor item"
    await page.getByText("Anchor item").click();
    await page.keyboard.press("Meta+v");

    // Cut item should reappear
    await expect(page.getByText("Complete Interaction OS docs")).toBeVisible();
    await expect(page.getByText("Anchor item")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 15. Focus recovery — delete restores focus to neighbor (SC-2)
  // ─────────────────────────────────────────────────────────────

  test("Deleting item moves focus to neighbor", async ({ page }) => {
    // Create two extra items (we already have "Complete Interaction OS docs")
    const draft = page.locator(DRAFT);
    await draft.click();
    await page.keyboard.type("Item A");
    await page.keyboard.press("Enter");
    await draft.click();
    await page.keyboard.type("Item B");
    await page.keyboard.press("Enter");

    // Focus "Item A" (middle item) and delete
    await page.getByText("Item A").click();
    const focused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(focused).toContainText("Item A");
    await page.keyboard.press("Backspace");

    // Focus should move to a neighbor — either "Item B" or "Complete Interaction OS docs"
    await expect(focused).toHaveCount(1);
    const focusedText = await focused.textContent();
    expect(
      focusedText?.includes("Item B") ||
      focusedText?.includes("Complete Interaction OS docs"),
    ).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // 16. Multi-select + bulk delete + Undo (SC-4)
  // ─────────────────────────────────────────────────────────────

  test("Shift+Arrow selects range, Backspace bulk deletes, Meta+Z undoes", async ({
    page,
  }) => {
    // Create 3 items
    const draft = page.locator(DRAFT);
    for (const text of ["Bulk A", "Bulk B", "Bulk C"]) {
      await draft.click();
      await page.keyboard.type(text);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByText("Bulk A")).toBeVisible();
    await expect(page.getByText("Bulk B")).toBeVisible();
    await expect(page.getByText("Bulk C")).toBeVisible();

    // Focus "Bulk A" then Shift+ArrowDown twice to select A, B, C
    await page.getByText("Bulk A").click();
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowDown");

    // Verify selection: should have selected items
    const selected = page.locator(`${LISTVIEW} [aria-selected="true"]`);
    await expect(selected).toHaveCount(3);

    // Bulk delete
    await page.keyboard.press("Backspace");
    await expect(page.getByText("Bulk A")).toHaveCount(0);
    await expect(page.getByText("Bulk B")).toHaveCount(0);
    await expect(page.getByText("Bulk C")).toHaveCount(0);

    // Undo → all 3 should reappear
    await page.keyboard.press("Meta+z");
    await expect(page.getByText("Bulk A")).toBeVisible();
    await expect(page.getByText("Bulk B")).toBeVisible();
    await expect(page.getByText("Bulk C")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // Field Key Ownership — Draft inline field navigation
  // ─────────────────────────────────────────────────────────────

  test("Shift+Tab from Draft escapes to sidebar, Tab returns to Draft", async ({
    page,
  }) => {
    // Click Draft to focus it
    const draft = page.locator(DRAFT);
    await draft.click();
    await expect(draft).toHaveAttribute("data-focused", "true");

    // Shift+Tab → backward escape: list zone → sidebar zone (sidebar is before list in DOM)
    await page.keyboard.press("Shift+Tab");
    const sidebarFocused = page.locator(
      `${SIDEBAR} [data-focused="true"]`,
    );
    await expect(sidebarFocused).toHaveCount(1);

    // Tab → forward escape: sidebar zone → list zone, landing on Draft (first item)
    await page.keyboard.press("Tab");
    await expect(draft).toHaveAttribute("data-focused", "true");
  });

  test("ArrowDown from Draft moves to first todo item", async ({ page }) => {
    // Click Draft to focus it
    const draft = page.locator(DRAFT);
    await draft.click();
    await expect(draft).toHaveAttribute("data-focused", "true");

    // ArrowDown → should move focus from Draft to the first todo item
    await page.keyboard.press("ArrowDown");

    // Draft should lose focus, first todo should gain focus
    const todoFocused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(todoFocused).toHaveCount(1);
    await expect(todoFocused).toContainText("Complete Interaction OS docs");
  });

  test("ArrowUp from first todo item moves to Draft", async ({ page }) => {
    // Click on the todo item to focus it
    await page.getByText("Complete Interaction OS docs").click();
    const todoFocused = page.locator(focusedTodoItem(LISTVIEW));
    await expect(todoFocused).toHaveCount(1);

    // ArrowUp → should move to Draft (previous item in zone)
    await page.keyboard.press("ArrowUp");

    const draft = page.locator(DRAFT);
    await expect(draft).toHaveAttribute("data-focused", "true");
  });
});
