/**
 * RadixPlaygroundBot — In-browser TestBot tests for Dialog component
 *
 * Mirrors the Playwright e2e spec but runs inside the browser
 * with a virtual cursor. Registered via useTestBotRoutes().
 */

import { type TestBot, useTestBotRoutes } from "@inspector/testbot";

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // 1. Basic Dialog — Open/Close
  // ─────────────────────────────────────────────────────────────
  bot.describe("Dialog: Open via trigger click", async (t) => {
    // Click "Open Dialog" button
    const openBtn = await t.getByText("Open Dialog");
    await t.click(openBtn);
    await t.wait(200);

    // First item should get focus (aria-current)
    await t.expect("#basic-opt-1").toHaveAttribute("aria-current", "true");
  });

  bot.describe("Dialog: Close via Close button", async (t) => {
    // Open
    const openBtn = await t.getByText("Open Dialog");
    await t.click(openBtn);
    await t.wait(200);

    // Click Close button inside dialog
    const closeBtn = await t.getByText("Close");
    await t.click(closeBtn);
    await t.wait(200);

    // Dialog content should not exist anymore
    await t.expect("#basic-opt-1").toNotExist();
  });

  bot.describe("Dialog: Close via ESC key", async (t) => {
    // Open
    const openBtn = await t.getByText("Open Dialog");
    await t.click(openBtn);
    await t.wait(200);

    // Verify open
    await t.expect("#basic-opt-1").toHaveAttribute("aria-current", "true");

    // Press ESC
    await t.press("Escape");
    await t.wait(200);

    // Verify closed
    await t.expect("#basic-opt-1").toNotExist();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Arrow Navigation inside Dialog
  // ─────────────────────────────────────────────────────────────
  bot.describe("Dialog: Arrow key navigation", async (t) => {
    // Open
    const openBtn = await t.getByText("Open Dialog");
    await t.click(openBtn);
    await t.wait(200);

    // First item focused
    await t.expect("#basic-opt-1").toHaveAttribute("aria-current", "true");

    // ArrowDown → second
    await t.press("ArrowDown");
    await t.wait(100);
    await t.expect("#basic-opt-2").toHaveAttribute("aria-current", "true");
    await t.expect("#basic-opt-1").toNotHaveAttribute("aria-current", "true");

    // ArrowDown → third
    await t.press("ArrowDown");
    await t.wait(100);
    await t.expect("#basic-opt-3").toHaveAttribute("aria-current", "true");

    // ArrowUp → back to second
    await t.press("ArrowUp");
    await t.wait(100);
    await t.expect("#basic-opt-2").toHaveAttribute("aria-current", "true");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Nested Dialogs
  // ─────────────────────────────────────────────────────────────
  bot.describe("Nested: Open two-level dialogs", async (t) => {
    // Open Level 1
    const l1Btn = await t.getByText("Open Level 1");
    await t.click(l1Btn);
    await t.wait(200);

    // Level 1 item focused
    await t.expect("#l1-item-1").toHaveAttribute("aria-current", "true");

    // Open Level 2
    const l2Btn = await t.getByText("Open Level 2");
    await t.click(l2Btn);
    await t.wait(200);

    // Level 2 item focused
    await t.expect("#l2-item-1").toHaveAttribute("aria-current", "true");
  });

  bot.describe("Nested: Close Level 2 restores Level 1", async (t) => {
    // Open both levels
    const l1Btn = await t.getByText("Open Level 1");
    await t.click(l1Btn);
    await t.wait(200);

    const l2Btn = await t.getByText("Open Level 2");
    await t.click(l2Btn);
    await t.wait(200);

    // Close Level 2
    const closeL2 = await t.getByText("Close Level 2");
    await t.click(closeL2);
    await t.wait(200);

    // Level 1 should be active again
    await t.expect("#l1-item-1").toHaveAttribute("aria-current", "true");

    // Level 2 items should not exist
    await t.expect("#l2-item-1").toNotExist();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Confirmation Dialog
  // ─────────────────────────────────────────────────────────────
  bot.describe("Confirmation: Cancel closes dialog", async (t) => {
    // Open confirmation
    const deleteBtn = await t.getByText("Delete Item");
    await t.click(deleteBtn);
    await t.wait(200);

    // Verify title visible
    const title = await t.getByText("Are you sure?");
    await t.expect(title).toExist();

    // Click Cancel
    const cancelBtn = await t.getByText("Cancel");
    await t.click(cancelBtn);
    await t.wait(200);

    // Verify closed
    await t.expect(title).toNotExist();
  });
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useRadixPlaygroundBotRoutes() {
  return useTestBotRoutes("radix-playground", defineTests);
}
