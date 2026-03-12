/**
 * TestBot Panel E2E — Verify eager-load + route/zone filtering + dry-run step preview.
 *
 * L1.5 verification: TestBot panel is browser-runtime infrastructure,
 * not testable via headless createPage(). Playwright E2E is the only
 * valid verification path.
 */

import { expect, test } from "@playwright/test";

/**
 * Open Inspector via localStorage and activate TestBot tab.
 * Inspector open state is persisted in localStorage under "inspector-ui".
 */
async function activateTestBotPanel(
  page: import("@playwright/test").Page,
  url: string,
) {
  // First load to establish origin
  await page.goto(url);
  await page.waitForLoadState("networkidle");

  // Set Inspector open state via localStorage
  await page.evaluate(() => {
    localStorage.setItem(
      "inspector-ui",
      JSON.stringify({
        isOpen: true,
        activeTab: "ELEMENT",
        isPanelExpanded: false,
      }),
    );
  });

  // Reload to pick up localStorage state — Inspector will render
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Click the TestBot tab in the activity bar
  const testbotTab = page.getByRole("button", { name: "TestBot", exact: true });
  await expect(testbotTab).toBeVisible({ timeout: 5_000 });
  await testbotTab.click();
}

test.describe("TestBot Panel — eager load + route filtering", () => {
  test("T1: /todo route shows Todo test suites as planned", async ({
    page,
  }) => {
    await activateTestBotPanel(page, "/todo");

    // Wait for at least one suite to appear with "planned" status
    const suites = page.locator("[data-testbot-suite]");
    await expect(suites.first()).toBeVisible({ timeout: 10_000 });

    // Verify suites have "planned" status (not yet executed)
    const plannedSuites = page.locator(
      '[data-testbot-suite][data-testbot-status="planned"]',
    );
    const count = await plannedSuites.count();
    expect(count).toBeGreaterThan(0);

    // Verify the group contains "Todo" (from testbot-todo.ts manifest entry)
    const todoGroup = page.locator("text=TODO");
    await expect(todoGroup.first()).toBeVisible();
  });

  test("T2: route change from /todo to /docs updates suite list", async ({
    page,
  }) => {
    await activateTestBotPanel(page, "/todo");

    // Wait for Todo suites to load
    const suites = page.locator("[data-testbot-suite]");
    await expect(suites.first()).toBeVisible({ timeout: 10_000 });

    // Capture Todo suite names
    const todoSuiteNames = await page
      .locator("[data-testbot-suite]")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-testbot-suite")),
      );
    expect(todoSuiteNames.length).toBeGreaterThan(0);

    // Navigate to /docs (Inspector stays open because localStorage persists)
    await page.goto("/docs");
    await page.waitForLoadState("networkidle");

    // Wait for suites to update — zone/route change triggers filterAndNotify
    await page.waitForTimeout(3000);

    const docsSuiteNames = await page
      .locator("[data-testbot-suite]")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-testbot-suite")),
      );

    // Suite lists should be different (different route = different scripts)
    if (docsSuiteNames.length > 0) {
      const sameList =
        todoSuiteNames.length === docsSuiteNames.length &&
        todoSuiteNames.every((n, i) => n === docsSuiteNames[i]);
      expect(sameList).toBe(false);
    }
    // If empty, that's also valid — docs route didn't match any manifest entry
  });

  test("T3: planned suites show dry-run step preview", async ({ page }) => {
    await activateTestBotPanel(page, "/todo");

    // Wait for suites to appear
    const suites = page.locator(
      '[data-testbot-suite][data-testbot-status="planned"]',
    );
    await expect(suites.first()).toBeVisible({ timeout: 10_000 });

    // Wait for dry-run to populate steps (async — give it time)
    // Step preview text appears as "N steps preview"
    const stepPreview = page.locator("text=steps preview");
    await expect(stepPreview.first()).toBeVisible({ timeout: 10_000 });

    // Click on a suite to expand it — should show step details
    await suites.first().click();

    // Verify step elements appear (dry-run populated BrowserStep[])
    const steps = page.locator("[data-testbot-step]");
    await expect(steps.first()).toBeVisible({ timeout: 5_000 });

    // Verify step actions are present (click/press/assert from dry-run)
    const stepActions = await steps.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-testbot-action")),
    );
    expect(stepActions.length).toBeGreaterThan(0);

    // At least one step should be a recognized action type
    const validActions = new Set(["click", "press", "assert"]);
    const hasValidAction = stepActions.some(
      (a) => a !== null && validActions.has(a),
    );
    expect(hasValidAction).toBe(true);
  });
});
