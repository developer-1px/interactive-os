import { expect, test } from "@playwright/test";

test("debug quickpick zone state", async ({ page }) => {
  await page.goto("/playground/command-palette");
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#root");
      return root && root.children.length > 0;
    },
    null,
    { timeout: 10000 },
  );

  await page.keyboard.press("Meta+k");

  const dialog = page.locator("dialog[open]");
  const input = dialog.locator(
    'input[placeholder="Search routes and docs..."]',
  );
  await expect(input).toBeVisible({ timeout: 3000 });

  // Check zone structure
  const zoneInfo = await page.evaluate(() => {
    const zones = document.querySelectorAll("[data-zone]");
    return Array.from(zones).map((z) => ({
      id: z.getAttribute("data-zone"),
      role: z.getAttribute("role"),
      itemCount: z.querySelectorAll("[data-item-id]").length,
      ariaCurrent: z.getAttribute("aria-current"),
    }));
  });

  console.log("Zone info:", JSON.stringify(zoneInfo, null, 2));

  // Press ArrowDown and check state
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);

  const afterArrow = await page.evaluate(() => {
    const options = document.querySelectorAll('[role="option"]');
    return Array.from(options)
      .slice(0, 5)
      .map((el) => ({
        id: el.getAttribute("data-item-id") || el.id,
        ariaSelected: el.getAttribute("aria-selected"),
        dataFocused: el.getAttribute("data-focused"),
        text: el.textContent?.substring(0, 30),
      }));
  });

  console.log("After ArrowDown:", JSON.stringify(afterArrow, null, 2));

  // Check active zone in kernel
  const kernelFocus = await page.evaluate(() => {
    const state = document.querySelectorAll('[aria-current="true"]');
    return Array.from(state).map((el) => ({
      id: el.getAttribute("data-zone") || el.id,
      role: el.getAttribute("role"),
    }));
  });

  console.log(
    "Active zones (aria-current=true):",
    JSON.stringify(kernelFocus, null, 2),
  );

  expect(true).toBe(true);
});
