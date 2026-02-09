/**
 * KernelLabBot — Kernel Lab Page Automated Tests
 *
 * Test suite for validating Kernel Step 2:
 * 1. Handlers (increment, decrement, reset, add-item)
 * 2. Commands (increment-and-notify, batch-add)
 * 3. Effects (notify effect log)
 * 4. Transaction Log (recording & time-travel)
 * 5. React Hooks (useComputed, useDispatch)
 */

import { type TestActions, type TestBot, useTestBotRoutes } from "@os/testBot";
import { resetKernelLab } from "../KernelLabPage";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/** Type text character-by-character */
async function type(t: TestActions, text: string) {
  for (const char of text) {
    await t.press(char === " " ? "Space" : char);
    await t.wait(20);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineTests(bot: TestBot) {
  // ─────────────────────────────────────────────────────────────
  // Lifecycle — Full kernel reset before each test
  // ─────────────────────────────────────────────────────────────
  bot.beforeEach(async (t) => {
    resetKernelLab();
    await t.wait(100);
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Handlers — Pure State Transformations
  // ─────────────────────────────────────────────────────────────
  bot.describe("Handler: Increment increases count", async (t) => {
    // 1. Get initial state
    const stateBefore = await t.getByText('"count": 0');
    await t.expect(stateBefore).toExist();

    // 2. Click increment button
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(100);

    // 3. Verify count increased
    const stateAfter = await t.getByText('"count": 1');
    await t.expect(stateAfter).toExist();
  });

  bot.describe("Handler: Multiple increments", async (t) => {
    // 1. Click increment 3 times
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(50);
    await t.click(incrementBtn);
    await t.wait(50);
    await t.click(incrementBtn);
    await t.wait(100);

    // 2. Verify count is 3
    const state = await t.getByText('"count": 3');
    await t.expect(state).toExist();
  });

  bot.describe("Handler: Decrement decreases count", async (t) => {
    // 1. Increment first
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(50);
    await t.click(incrementBtn);
    await t.wait(100);

    // 2. Decrement once
    const decrementBtn = await t.getByText("− Decrement");
    await t.click(decrementBtn);
    await t.wait(100);

    // 3. Verify count is 1
    const state = await t.getByText('"count": 1');
    await t.expect(state).toExist();
  });

  bot.describe("Handler: Reset clears state", async (t) => {
    // 1. Increment to change state
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(100);

    // 2. Click reset
    const resetBtn = await t.getByText("↺ Reset");
    await t.click(resetBtn);
    await t.wait(100);

    // 3. Verify count is back to 0
    const state = await t.getByText('"count": 0');
    await t.expect(state).toExist();
  });

  bot.describe("Handler: Add item to list", async (t) => {
    // 1. Type text in input
    const input = await t.getByRole("textbox");
    await t.click(input);
    await type(t, "Test Item");

    // 2. Click Add button
    const addBtn = await t.getByText("+ Add");
    await t.click(addBtn);
    await t.wait(200);

    // 3. Verify item appears in state
    const item = await t.getByText('"Test Item"');
    await t.expect(item).toExist();
  });

  bot.describe("Handler: Remove last item", async (t) => {
    // 1. Add an item first
    const input = await t.getByRole("textbox");
    await t.click(input);
    await type(t, "Remove Me");
    const addBtn = await t.getByText("+ Add");
    await t.click(addBtn);
    await t.wait(200);

    // 2. Click Remove button
    const removeBtn = await t.getByText("− Remove");
    await t.click(removeBtn);
    await t.wait(100);

    // 3. Verify item is gone
    const item = await t.getByText('"Remove Me"');
    await t.expect(item).toNotExist();
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Commands — State + Effects
  // ─────────────────────────────────────────────────────────────
  bot.describe("Command: Increment + Notify triggers effect", async (t) => {
    // 1. Click command button
    const commandBtn = await t.getByText("⚡ Increment + Notify");
    await t.click(commandBtn);
    await t.wait(200);

    // 2. Verify count increased
    const state = await t.getByText('"count": 1');
    await t.expect(state).toExist();

    // 3. Verify effect log shows message
    const effect = await t.getByText("Count is now 1");
    await t.expect(effect).toExist();
  });

  bot.describe("Command: Batch Add — effect + re-dispatch", async (t) => {
    // 1. Click batch add
    const batchBtn = await t.getByText("⚡ Batch Add (effect + re-dispatch)");
    await t.click(batchBtn);
    await t.wait(300);

    // 2. Verify count increased (from re-dispatched increment)
    const state = await t.getByText('"count": 1');
    await t.expect(state).toExist();

    // 3. Verify item was added
    const items = await t.getByText('"items"');
    await t.expect(items).toExist();

    // 4. Verify effect log shows notification (partial match)
    const effect = await t.getByText("Added item at");
    await t.expect(effect).toExist();
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Transaction Log
  // ─────────────────────────────────────────────────────────────
  bot.describe("Transaction: Each dispatch creates transaction", async (t) => {
    // 1. Click increment
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(100);

    // 2. Verify transaction log shows entry
    const txEntry = await t.getByText("#0");
    await t.expect(txEntry).toExist();

    // 3. Click again
    await t.click(incrementBtn);
    await t.wait(100);

    // 4. Verify second transaction
    const tx2 = await t.getByText("#1");
    await t.expect(tx2).toExist();
  });

  bot.describe("Transaction: Time-travel restores state", async (t) => {
    // 1. Increment 3 times
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(50);
    await t.click(incrementBtn);
    await t.wait(50);
    await t.click(incrementBtn);
    await t.wait(200);

    // 2. Verify count is 3
    const state3 = await t.getByText('"count": 3');
    await t.expect(state3).toExist();

    // 3. Click transaction #1 (count should be 2)
    const tx1 = await t.getByText("#1");
    await t.click(tx1);
    await t.wait(200);

    // 4. Verify state rolled back
    const state2 = await t.getByText('"count": 2');
    await t.expect(state2).toExist();
  });

  bot.describe("Transaction: Shows handler vs command type", async (t) => {
    // 1. Dispatch a handler
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(100);

    // 2. Verify "handler" badge exists
    const handlerBadge = await t.getByText("handler");
    await t.expect(handlerBadge).toExist();

    // 3. Dispatch a command
    const commandBtn = await t.getByText("⚡ Increment + Notify");
    await t.click(commandBtn);
    await t.wait(100);

    // 4. Verify "command" badge exists
    const commandBadge = await t.getByText("command");
    await t.expect(commandBadge).toExist();
  });

  bot.describe("Transaction: Clear log works", async (t) => {
    // 1. Create some transactions
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(50);
    await t.click(incrementBtn);
    await t.wait(100);

    // 2. Verify transactions exist
    const tx0 = await t.getByText("#0");
    await t.expect(tx0).toExist();

    // 3. Click clear button in Transaction panel
    const clearBtns = await t.getAllByText("Clear");
    // Should have 2 clear buttons (Effect Log + Transaction Log)
    await t.click(clearBtns[clearBtns.length - 1]); // Last clear = Transaction
    await t.wait(100);

    // 4. Verify transactions are gone
    await t.expect(tx0).toNotExist();

    // 5. Verify empty state message appears
    const emptyMsg = await t.getByText(
      "Dispatch some commands to see transactions",
    );
    await t.expect(emptyMsg).toExist();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Effect Log
  // ─────────────────────────────────────────────────────────────
  bot.describe("Effect Log: Records custom effects", async (t) => {
    // 1. Click command that triggers notify effect
    const commandBtn = await t.getByText("⚡ Increment + Notify");
    await t.click(commandBtn);
    await t.wait(200);

    // 2. Verify effect log shows entry with index
    const effectIndex = await t.getByText("#0");
    await t.expect(effectIndex).toExist();
  });

  bot.describe("Effect Log: Clear works", async (t) => {
    // 1. Trigger effect
    const commandBtn = await t.getByText("⚡ Increment + Notify");
    await t.click(commandBtn);
    await t.wait(200);

    // 2. Click clear in Effect Log panel
    const clearBtns = await t.getAllByText("Clear");
    await t.click(clearBtns[0]); // Effect panel's clear
    await t.wait(100);

    // 3. Verify empty state
    const emptyMsg = await t.getByText("No effects executed yet");
    await t.expect(emptyMsg).toExist();
  });

  // ─────────────────────────────────────────────────────────────
  // 5. React Hooks Integration
  // ─────────────────────────────────────────────────────────────
  bot.describe("useComputed: State updates trigger re-render", async (t) => {
    // 1. Get initial state
    const stateBefore = await t.getByText('"count": 0');
    await t.expect(stateBefore).toExist();

    // 2. Increment via dispatch
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(100);

    // 3. Verify UI updated (useComputed hook working)
    const stateAfter = await t.getByText('"count": 1');
    await t.expect(stateAfter).toExist();

    // 4. Verify old state no longer visible
    await t.expect(stateBefore).toNotExist();
  });

  bot.describe("useDispatch: Returns stable dispatch function", async (t) => {
    // This test verifies dispatch works correctly through useDispatch hook
    // by performing multiple operations in sequence

    // 1. Increment
    const incrementBtn = await t.getByText("+ Increment");
    await t.click(incrementBtn);
    await t.wait(50);

    // 2. Decrement
    const decrementBtn = await t.getByText("− Decrement");
    await t.click(decrementBtn);
    await t.wait(50);

    // 3. Command
    const commandBtn = await t.getByText("⚡ Increment + Notify");
    await t.click(commandBtn);
    await t.wait(200);

    // 4. Verify final state (should be 1)
    const finalState = await t.getByText('"count": 1');
    await t.expect(finalState).toExist();

    // 5. Verify all operations recorded in transaction log
    const tx0 = await t.getByText("#0");
    await t.expect(tx0).toExist();
    const tx2 = await t.getByText("#2");
    await t.expect(tx2).toExist();
  });
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useKernelLabBotRoutes() {
  return useTestBotRoutes("kernel-lab", defineTests);
}
