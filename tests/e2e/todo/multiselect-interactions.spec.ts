import { expect, test } from "@playwright/test";

const DRAFT = '[data-placeholder="Add a new task..."]';
const LISTVIEW = '[role="listbox"]#list';

test.describe("Todo App - Mouse Multi-Select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(DRAFT, { timeout: 15000 });

    // Setup: Create 3 items
    const draft = page.locator(DRAFT);
    for (const text of ["Item A", "Item B", "Item C"]) {
      await draft.click();
      await page.keyboard.type(text);
      await page.keyboard.press("Enter");
    }
    // Wait for items to be visible
    await expect(page.getByText("Item A")).toBeVisible();
    await expect(page.getByText("Item B")).toBeVisible();
    await expect(page.getByText("Item C")).toBeVisible();
  });

  test("Shift+Click selects range (A to C)", async ({ page }) => {
    // 1. Click Item A
    await page.getByText("Item A").click();
    await expect(
      page.locator(`${LISTVIEW} [aria-selected="true"]`),
    ).toHaveCount(1);

    // 2. Shift+Click Item C
    await page.getByText("Item C").click({ modifiers: ["Shift"] });

    // 3. Expect A, B, C to be selected
    const selected = page.locator(`${LISTVIEW} [aria-selected="true"]`);
    await expect(selected).toHaveCount(3);
    const texts = await selected.allTextContents();
    expect(texts).toContain("Item A");
    expect(texts).toContain("Item B");
    expect(texts).toContain("Item C");
  });

  test("Cmd+Click toggles selection (A and C)", async ({ page }) => {
    // 1. Click Item A
    await page.getByText("Item A").click();

    // 2. Cmd+Click Item C
    await page.getByText("Item C").click({ modifiers: ["Meta"] });

    // 3. Expect A and C to be selected (B is NOT selected)
    const selected = page.locator(`${LISTVIEW} [aria-selected="true"]`);
    await expect(selected).toHaveCount(2);
    const texts = await selected.allTextContents();
    expect(texts).toContain("Item A");
    expect(texts).toContain("Item C");
    expect(texts.some((t) => t.includes("Item B"))).toBe(false);
  });

  test("Alt+Click acts as Replace (Default)", async ({ page }) => {
    // 1. Click Item A
    await page.getByText("Item A").click();

    // 2. Alt+Click Item C
    await page.getByText("Item C").click({ modifiers: ["Alt"] });

    // 3. Expect ONLY C to be selected (Replace mode)
    const selected = page.locator(`${LISTVIEW} [aria-selected="true"]`);
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText("Item C");
  });
});
