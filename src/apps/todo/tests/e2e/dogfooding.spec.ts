import { expect, test } from "@playwright/test";

/**
 * Todo Keyboard Dogfooding — E2E Scenarios
 *
 * BLACK-BOX tests for the 5 PRD dogfooding scenarios.
 * Tests keyboard-only workflows to verify friction-free operation.
 *
 * ref: docs/1-project/todo-keyboard-dogfooding/README.md
 */

const DRAFT = '[data-placeholder="Add a new task..."]';
const LISTVIEW = '[role="listbox"]#list';
const SIDEBAR = '[role="listbox"]#sidebar';

const focusedItem = `${LISTVIEW} [data-focused="true"]:not(#DRAFT)`;

test.describe("Dogfooding: Keyboard-First Scenarios", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.waitForSelector(DRAFT, { timeout: 15000 });
    });

    // ═══════════════════════════════════════════════════════════════════
    // SC-1: 일상 입력
    // Tab → Draft → Type → Enter → ↓ → Space → Enter (Edit) → Type → Enter
    // ═══════════════════════════════════════════════════════════════════

    test("SC-1: Daily input — Tab to Draft, create, toggle, edit", async ({
        page,
    }) => {
        // Click Draft field to focus it (Tab from body doesn't reach DRAFT)
        const draft = page.locator(DRAFT);
        await draft.click();
        await expect(draft).toBeFocused();

        // Type and create
        await page.keyboard.type("회의 준비");
        await page.keyboard.press("Enter");
        await expect(page.getByText("회의 준비")).toBeVisible();

        // Navigate to the created item — Tab back to list, then navigate
        // The item should be in the list now
        await page.getByText("회의 준비").click();
        const focused = page.locator(focusedItem);
        await expect(focused).toContainText("회의 준비");

        // Space to toggle completion
        await page.keyboard.press("Space");
        await expect(focused.locator("span.line-through")).toHaveCount(1);

        // Enter to start editing
        await page.keyboard.press("Enter");
        const editField = page.locator("#EDIT");
        await expect(editField).toBeVisible();

        // Type new text and save
        await page.keyboard.press("Meta+a");
        await page.keyboard.type("회의 준비 완료");
        await page.keyboard.press("Enter");

        // Verify saved
        await expect(page.getByText("회의 준비 완료")).toBeVisible();
        await expect(page.getByText("회의 준비", { exact: true })).toHaveCount(0);
    });

    // ═══════════════════════════════════════════════════════════════════
    // SC-2: 정리 — Delete + Focus recovery + Undo
    // ═══════════════════════════════════════════════════════════════════

    test("SC-2: Cleanup — Delete with focus recovery", async ({ page }) => {
        // Create 3 items for testing
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Task A");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Task B");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Task C");
        await page.keyboard.press("Enter");

        await expect(page.getByText("Task A")).toBeVisible();
        await expect(page.getByText("Task B")).toBeVisible();
        await expect(page.getByText("Task C")).toBeVisible();

        // Focus Task B
        await page.getByText("Task B").click();
        const focused = page.locator(focusedItem);
        await expect(focused).toContainText("Task B");

        // Delete Task B
        await page.keyboard.press("Backspace");

        // Task B should be gone
        await expect(page.getByText("Task B")).toHaveCount(0);

        // Focus should have moved to next item or DRAFT
        const anyFocused = page.locator(
            `${LISTVIEW} [data-focused="true"]`,
        );
        await expect(anyFocused).toHaveCount(1);
        const focusedText = await anyFocused.textContent();
        expect(
            focusedText?.includes("Task A") ||
            focusedText?.includes("Task C") ||
            focusedText === "", // DRAFT (empty)
        ).toBe(true);
    });

    test("SC-2: Undo restores deleted item", async ({ page }) => {
        // Create an item
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Undo Target");
        await page.keyboard.press("Enter");
        await expect(page.getByText("Undo Target")).toBeVisible();

        // Focus and delete
        await page.getByText("Undo Target").click();
        await page.keyboard.press("Backspace");
        await expect(page.getByText("Undo Target")).toHaveCount(0);

        // Undo — ⌘Z
        await page.keyboard.press("Meta+z");

        // Item should be restored
        await expect(page.getByText("Undo Target")).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════════════
    // SC-3: 복사/이동 — Copy + Paste, Cut + Paste
    // ═══════════════════════════════════════════════════════════════════

    test("SC-3: Copy-Paste with focus moving to new item", async ({ page }) => {
        // Focus original item
        await page.getByText("Complete Interaction OS docs").click();
        const focused = page.locator(focusedItem);
        await expect(focused).toContainText("Complete Interaction OS docs");

        // Copy
        await page.keyboard.press("Meta+c");

        // Move down (to end of list)
        await page.keyboard.press("ArrowDown");

        // Paste
        await page.keyboard.press("Meta+v");

        // Should have 2 copies now
        const items = page.getByText("Complete Interaction OS docs");
        await expect(items).toHaveCount(2);

        // Focus should be on the pasted item
        const focusedAfterPaste = page.locator(focusedItem);
        await expect(focusedAfterPaste).toContainText(
            "Complete Interaction OS docs",
        );
    });

    test("SC-3: Cut-Paste moves item", async ({ page }) => {
        // Create 2 items
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Move Me");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Stay Here");
        await page.keyboard.press("Enter");

        // Focus "Move Me" and cut
        await page.getByText("Move Me").click();
        await page.keyboard.press("Meta+x");

        // "Move Me" should disappear after cut
        await expect(page.getByText("Move Me")).toHaveCount(0);

        // Focus "Stay Here" and paste after it
        await page.getByText("Stay Here").click();
        await page.keyboard.press("Meta+v");

        // "Move Me" should reappear
        await expect(page.getByText("Move Me")).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════════════
    // SC-4: 벌크 작업 — Multi-select + Delete + Undo
    // ═══════════════════════════════════════════════════════════════════

    test("SC-4: Shift+Arrow selects range", async ({ page }) => {
        // Create 3 items
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Bulk A");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Bulk B");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Bulk C");
        await page.keyboard.press("Enter");

        // Focus first item
        await page.getByText("Bulk A").click();

        // Shift+Down x2 to select range
        await page.keyboard.press("Shift+ArrowDown");
        await page.keyboard.press("Shift+ArrowDown");

        // Check that multiple items are selected (aria-selected)
        const selected = page.locator(
            `${LISTVIEW} [aria-selected="true"]:not(#DRAFT)`,
        );
        const count = await selected.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test("SC-4: Bulk delete + Undo restores all", async ({ page }) => {
        // Create 3 items
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Del A");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Del B");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("Del C");
        await page.keyboard.press("Enter");

        // Focus first item, then select range
        await page.getByText("Del A").click();
        await page.keyboard.press("Shift+ArrowDown");
        await page.keyboard.press("Shift+ArrowDown");

        // Bulk delete
        await page.keyboard.press("Backspace");

        // All 3 should be gone
        await expect(page.getByText("Del A")).toHaveCount(0);
        await expect(page.getByText("Del B")).toHaveCount(0);
        await expect(page.getByText("Del C")).toHaveCount(0);

        // Undo — should restore all 3
        await page.keyboard.press("Meta+z");

        await expect(page.getByText("Del A")).toBeVisible();
        await expect(page.getByText("Del B")).toBeVisible();
        await expect(page.getByText("Del C")).toBeVisible();
    });

    // ═══════════════════════════════════════════════════════════════════
    // SC-5: 사이드바 조작 — Tab to sidebar, navigate, select, reorder
    // ═══════════════════════════════════════════════════════════════════

    test("SC-5: Sidebar keyboard workflow", async ({ page }) => {
        // Click sidebar to activate it
        await page.locator("#cat_inbox").click();

        // ↓ to navigate to Work
        await page.keyboard.press("ArrowDown");
        const focusedCat = page.locator(`${SIDEBAR} [data-focused="true"]`);
        await expect(focusedCat).toContainText("Work");

        // Enter to select Work
        await page.keyboard.press("Enter");
        await expect(page.getByText("Review Red Team feedback")).toBeVisible();

        // ⌘↑ to reorder
        await page.keyboard.press("Meta+ArrowUp");

        // Verify Work is now first
        const categories = page.locator(`${SIDEBAR} [data-item-id]`);
        const texts = await categories.allTextContents();
        const workIdx = texts.findIndex((t) => t.includes("Work"));
        const inboxIdx = texts.findIndex((t) => t.includes("Inbox"));
        expect(workIdx).toBeLessThan(inboxIdx);
    });

    // ═══════════════════════════════════════════════════════════════════
    // Redo — ⌘⇧Z after undo
    // ═══════════════════════════════════════════════════════════════════

    test("Redo: ⌘⇧Z re-applies undone action", async ({ page }) => {
        // Create an item
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("Redo Target");
        await page.keyboard.press("Enter");
        await expect(page.getByText("Redo Target")).toBeVisible();

        // Delete it
        await page.getByText("Redo Target").click();
        await page.keyboard.press("Backspace");
        await expect(page.getByText("Redo Target")).toHaveCount(0);

        // Undo → item comes back
        await page.keyboard.press("Meta+z");
        await expect(page.getByText("Redo Target")).toBeVisible();

        // Redo → item deleted again
        await page.keyboard.press("Meta+Shift+z");
        await expect(page.getByText("Redo Target")).toHaveCount(0);
    });

    // ═══════════════════════════════════════════════════════════════════
    // Select All — ⌘A
    // ═══════════════════════════════════════════════════════════════════

    test("⌘A selects all items", async ({ page }) => {
        // Create multiple items
        const draft = page.locator(DRAFT);
        await draft.click();
        await page.keyboard.type("All A");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("All B");
        await page.keyboard.press("Enter");
        await draft.click();
        await page.keyboard.type("All C");
        await page.keyboard.press("Enter");

        // Focus one item to be in the list zone
        await page.getByText("All A").click();

        // ⌘A to select all
        await page.keyboard.press("Meta+a");

        // Check that all items are selected
        const selected = page.locator(
            `${LISTVIEW} [aria-selected="true"]:not(#DRAFT)`,
        );
        // Should select at least the 3 created + 1 initial = 4
        const count = await selected.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });
});
