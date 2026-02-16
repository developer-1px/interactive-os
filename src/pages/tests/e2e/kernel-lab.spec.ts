import { expect, test } from "@playwright/test";

/**
 * Kernel Lab — Black-Box E2E Tests
 *
 * Pure Playwright. Tests interact exactly as a user would.
 *
 * Initial state:
 *   - count: 0, items: [], lastAction: "(none)"
 *
 * UI structure:
 *   - State Panel: <pre> with JSON.stringify of state
 *   - Control Panel: Increment, Decrement, Reset buttons + input + Add/Remove
 *   - Effect Log Panel: shows NOTIFY effect messages (ul > li with #index)
 *   - Transaction Panel: shows transaction history as buttons with #id
 */

const STATE_PRE = "pre"; // State is rendered in a <pre> tag

test.describe("Kernel Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playground/kernel");
    // Wait for the state panel to render
    await page.waitForSelector(STATE_PRE, { timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Handlers — Pure State Transformations
  // ─────────────────────────────────────────────────────────────

  test("Handler: Increment increases count", async ({ page }) => {
    await expect(page.getByText('"count": 0')).toBeVisible();

    await page.getByText("+ Increment").click();

    await expect(page.getByText('"count": 1')).toBeVisible();
  });

  test("Handler: Multiple increments", async ({ page }) => {
    const btn = page.getByText("+ Increment");
    await btn.click();
    await btn.click();
    await btn.click();

    await expect(page.getByText('"count": 3')).toBeVisible();
  });

  test("Handler: Decrement decreases count", async ({ page }) => {
    const incBtn = page.getByText("+ Increment");
    await incBtn.click();
    await incBtn.click();

    await page.getByText("− Decrement").click();

    await expect(page.getByText('"count": 1')).toBeVisible();
  });

  test("Handler: Reset clears state", async ({ page }) => {
    await page.getByText("+ Increment").click();
    await page.getByText("↺ Reset").click();

    await expect(page.getByText('"count": 0')).toBeVisible();
  });

  test("Handler: Add item to list", async ({ page }) => {
    // fill() clears existing value and sets new value atomically
    const input = page.locator('input[placeholder="Item name..."]');
    await input.fill("Test Item");

    await page.getByText("+ Add").click();

    // Verify item appears in state JSON (scoped to <pre> to avoid strict mode)
    await expect(page.locator("pre")).toContainText("Test Item");
  });

  test("Handler: Remove last item", async ({ page }) => {
    // Add an item first
    const input = page.locator('input[placeholder="Item name..."]');
    await input.fill("Remove Me");
    await page.getByText("+ Add").click();

    // Verify item was added (check state JSON in <pre>)
    await expect(page.locator("pre")).toContainText("Remove Me");

    // Remove it
    await page.getByText("− Remove").click();

    // Verify item is gone from state
    await expect(page.locator("pre")).not.toContainText("Remove Me");
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Commands — State + Effects
  // ─────────────────────────────────────────────────────────────

  test("Command: Increment + Notify triggers effect", async ({ page }) => {
    await page.getByText("⚡ Increment + Notify").click();

    // Count increased
    await expect(page.getByText('"count": 1')).toBeVisible();

    // Effect log shows message
    await expect(page.getByText("Count is now 1")).toBeVisible();
  });

  test("Command: Batch Add — effect + re-dispatch", async ({ page }) => {
    await page.getByText("⚡ Batch Add (effect + re-dispatch)").click();

    // Count increased (from re-dispatched INCREMENT)
    await expect(page.getByText('"count": 1')).toBeVisible();

    // Effect log shows notification
    await expect(page.getByText("Added item at")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Transaction Log
  // ─────────────────────────────────────────────────────────────

  test("Transaction: Each dispatch creates transaction", async ({ page }) => {
    const btn = page.getByText("+ Increment");

    await btn.click();
    // Transaction log entries appear as buttons with "#N COMMAND_TYPE"
    await expect(page.locator("button", { hasText: "#0" })).toBeVisible();

    await btn.click();
    await expect(page.locator("button", { hasText: "#1" })).toBeVisible();
  });

  test("Transaction: Time-travel restores state", async ({ page }) => {
    const btn = page.getByText("+ Increment");
    await btn.click();
    await btn.click();
    await btn.click();

    await expect(page.getByText('"count": 3')).toBeVisible();

    // Click transaction #1 button (count was 2 after tx1)
    await page.locator("button", { hasText: "#1" }).click();

    await expect(page.getByText('"count": 2')).toBeVisible();
  });

  test("Transaction: Clear log works", async ({ page }) => {
    const btn = page.getByText("+ Increment");
    await btn.click();
    await btn.click();

    // Verify transactions exist (heading shows count)
    await expect(page.getByText("Transaction Log (2)")).toBeVisible();

    // Click Transaction panel's Clear button (last "Clear" on the page)
    await page.getByText("Clear").last().click();

    // Verify transactions cleared (heading shows 0)
    await expect(page.getByText("Transaction Log (0)")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Effect Log
  // ─────────────────────────────────────────────────────────────

  test("Effect Log: Records custom effects", async ({ page }) => {
    await page.getByText("⚡ Increment + Notify").click();

    // Effect log entry shows "Count is now 1"
    await expect(page.getByText("Count is now 1")).toBeVisible();
  });

  test("Effect Log: Clear works", async ({ page }) => {
    await page.getByText("⚡ Increment + Notify").click();

    // Click Effect Log panel's Clear button (first "Clear" on the page)
    await page.getByText("Clear").first().click();

    await expect(page.getByText("No effects executed yet")).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. React Hooks Integration
  // ─────────────────────────────────────────────────────────────

  test("useComputed: State updates trigger re-render", async ({ page }) => {
    await expect(page.getByText('"count": 0')).toBeVisible();

    await page.getByText("+ Increment").click();

    // UI updated (useComputed hook working)
    await expect(page.getByText('"count": 1')).toBeVisible();

    // Old state no longer visible
    await expect(page.getByText('"count": 0')).toHaveCount(0);
  });

  test("useDispatch: Stable dispatch across operations", async ({ page }) => {
    // Increment
    await page.getByText("+ Increment").click();
    // Decrement
    await page.getByText("− Decrement").click();
    // Command
    await page.getByText("⚡ Increment + Notify").click();

    // Final state: 0 + 1 - 1 + 1 = 1
    await expect(page.getByText('"count": 1')).toBeVisible();

    // All operations recorded as transaction buttons
    await expect(page.locator("button", { hasText: "#0" })).toBeVisible();
    await expect(page.locator("button", { hasText: "#2" })).toBeVisible();
  });
});
