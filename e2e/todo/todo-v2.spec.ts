import { expect, test } from "@playwright/test";

/**
 * Todo App v2 — Black-Box E2E Tests (TodoModule version)
 *
 * Identical to todo.spec.ts but runs against /playground/todo-v2 route.
 * Validates that the createModule-based TodoModule is production-ready.
 */

const DRAFT = '[data-placeholder="Add a new task..."]';
const LISTVIEW = '[role="listbox"]#listView';
const SIDEBAR = '[role="listbox"]#sidebar';

const focusedTodoItem = (listview: string) =>
    `${listview} [data-focused="true"]:not(#DRAFT)`;

test.describe("Todo App v2 (createModule)", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/playground/todo-v2");
        await page.waitForSelector(DRAFT, { timeout: 15000 });
    });

    // 1. Creation
    test("Create todo via draft input", async ({ page }) => {
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Buy milk");
        await page.keyboard.press("Enter");
        await expect(page.getByText("Buy milk")).toBeVisible();
    });

    // 2. Click to focus
    test("Clicking a todo item focuses it", async ({ page }) => {
        await page.getByText("Complete Interaction OS docs").click();
        const focused = page.locator(focusedTodoItem(LISTVIEW));
        await expect(focused).toHaveCount(1);
        await expect(focused).toContainText("Complete Interaction OS docs");
    });

    // 3. Toggle
    test("Space toggles todo completion", async ({ page }) => {
        await page.getByText("Complete Interaction OS docs").click();
        const focused = page.locator(focusedTodoItem(LISTVIEW));
        await expect(focused).toContainText("Complete Interaction OS docs");

        await page.keyboard.press("Space");
        await expect(focused.locator("span.line-through")).toHaveCount(1);

        await page.keyboard.press("Space");
        await expect(focused.locator("span.line-through")).toHaveCount(0);
    });

    // 4. Edit — Enter → type → Enter saves
    test("Edit todo: Enter → type → Enter saves", async ({ page }) => {
        await page.getByText("Complete Interaction OS docs").click();
        await page.keyboard.press("Enter");

        const editField = page.locator("#EDIT");
        await expect(editField).toBeVisible();

        await page.keyboard.press("Meta+a");
        await page.keyboard.type("Updated docs task");
        await page.keyboard.press("Enter");

        await expect(page.getByText("Updated docs task")).toBeVisible();
        await expect(page.getByText("Complete Interaction OS docs")).toHaveCount(0);
    });

    // 5. Edit — Enter → type → Escape cancels
    test("Edit todo: Enter → type → Escape cancels", async ({ page }) => {
        await page.getByText("Complete Interaction OS docs").click();
        await page.keyboard.press("Enter");

        const editField = page.locator("#EDIT");
        await expect(editField).toBeVisible();

        await page.keyboard.press("Meta+a");
        await page.keyboard.type("This should be discarded");
        await page.keyboard.press("Escape");

        await expect(page.getByText("Complete Interaction OS docs")).toBeVisible();
        await expect(page.getByText("This should be discarded")).toHaveCount(0);
    });

    // 6. Delete — Backspace
    test("Backspace deletes focused todo", async ({ page }) => {
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Temporary task");
        await page.keyboard.press("Enter");
        await expect(page.getByText("Temporary task")).toBeVisible();

        await page.getByText("Temporary task").click();
        const focused = page.locator(focusedTodoItem(LISTVIEW));
        await expect(focused).toContainText("Temporary task");

        await page.keyboard.press("Backspace");
        await expect(page.getByText("Temporary task")).toHaveCount(0);
    });

    // 7. Reorder — Meta+Arrow
    test("Meta+Arrow reorders items", async ({ page }) => {
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Second task");
        await page.keyboard.press("Enter");
        await expect(page.getByText("Second task")).toBeVisible();

        await page.getByText("Second task").click();
        const focused = page.locator(focusedTodoItem(LISTVIEW));
        await expect(focused).toContainText("Second task");

        await page.keyboard.press("Meta+ArrowUp");

        const items = page.locator(`${LISTVIEW} [data-item-id]:not(#DRAFT)`);
        const texts = await items.allTextContents();
        const secondIdx = texts.findIndex((t) => t.includes("Second task"));
        const firstIdx = texts.findIndex((t) =>
            t.includes("Complete Interaction OS docs"),
        );
        expect(secondIdx).toBeLessThan(firstIdx);
    });

    // 8. Arrow navigation
    test("Arrow navigation between todo items", async ({ page }) => {
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Second task");
        await page.keyboard.press("Enter");

        await page.getByText("Complete Interaction OS docs").click();
        const focused = page.locator(focusedTodoItem(LISTVIEW));
        await expect(focused).toContainText("Complete Interaction OS docs");

        await page.keyboard.press("ArrowDown");
        await expect(focused).toContainText("Second task");

        await page.keyboard.press("ArrowUp");
        await expect(focused).toContainText("Complete Interaction OS docs");
    });

    // 9. Clipboard — Meta+C / Meta+V
    test("Meta+C then Meta+V duplicates item", async ({ page }) => {
        await page.getByText("Complete Interaction OS docs").click();
        const focused = page.locator(focusedTodoItem(LISTVIEW));
        await expect(focused).toContainText("Complete Interaction OS docs");

        await page.keyboard.press("Meta+c");
        await page.keyboard.press("Meta+v");

        const items = page.getByText("Complete Interaction OS docs");
        await expect(items).toHaveCount(2);
    });

    // 10. Sidebar — Click category
    test("Click sidebar category switches list", async ({ page }) => {
        await expect(page.getByText("Complete Interaction OS docs")).toBeVisible();

        await page.locator("#cat_work").click();

        await expect(page.getByText("Review Red Team feedback")).toBeVisible();
        await expect(page.getByText("Plan next iteration")).toBeVisible();
        await expect(page.getByText("Complete Interaction OS docs")).toHaveCount(0);
    });

    // 11. Sidebar — Keyboard navigation
    test("Sidebar keyboard navigation and selection", async ({ page }) => {
        await page.locator("#cat_inbox").click();

        await page.keyboard.press("ArrowDown");
        const focusedCat = page.locator(
            `${SIDEBAR} [data-focused="true"]`,
        );
        await expect(focusedCat).toContainText("Work");

        await page.keyboard.press("Enter");
        await expect(page.getByText("Review Red Team feedback")).toBeVisible();
    });

    // 12. Sidebar — Meta+Arrow reorders categories
    test("Sidebar Meta+Arrow reorders categories", async ({ page }) => {
        await page.locator("#cat_inbox").click();

        await page.keyboard.press("Meta+ArrowDown");

        const categories = page.locator(`${SIDEBAR} [data-item-id]`);
        const texts = await categories.allTextContents();
        const inboxIdx = texts.findIndex((t) => t.includes("Inbox"));
        const workIdx = texts.findIndex((t) => t.includes("Work"));
        expect(workIdx).toBeLessThan(inboxIdx);
    });
});
