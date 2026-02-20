import { expect, test } from "@playwright/test";

test("Todo Multi-Select Copy Paste Bug", async ({ page }) => {
  // Use root path which renders TodoPage directly (via _todo layout)
  await page.goto("/");

  // 1. Clear state
  await page.evaluate(() => {
    localStorage.clear();
    location.reload();
  });

  // Wait for load - using placeholder "Add a new task..."
  const input = page.getByPlaceholder("Add a new task...");
  await expect(input).toBeVisible();

  // 2. Add 3 items
  await input.fill("Item A");
  await input.press("Enter");
  await input.fill("Item B");
  await input.press("Enter");
  await input.fill("Item C");
  await input.press("Enter");

  // Verify list has 3 items
  // Assuming listbox role is applied correctly via TodoApp.bind({ role: "listbox" })
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByRole("option")).toHaveCount(3);

  // 3. Focus "Item C"
  // Click exact text
  await page.getByText("Item C", { exact: true }).click();

  // 4. Shift+Up to select C and B
  await page.keyboard.press("Shift+ArrowUp");

  // Allow small time for selection state update
  await page.waitForTimeout(100);

  // 5. Copy (Meta+C)
  await page.keyboard.press("Meta+c");

  // 6. Paste (Meta+V)
  await page.keyboard.press("Meta+v");

  // 7. Expected: 3 + 2 = 5 items.
  await expect(listbox.getByRole("option")).toHaveCount(5);
});
