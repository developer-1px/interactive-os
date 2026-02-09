/**
 * Kernel Step 1 Verification
 *
 * Run: npx tsx packages/kernel/src/__tests__/step1.ts
 * Tests the full dispatch → handler/command → effect → transaction loop.
 */

import {
  clearTransactions,
  defineCommand,
  defineEffect,
  dispatch,
  getLastTransaction,
  getTransactions,
  initKernel,
  travelTo,
} from "../index.ts";

// ── Setup ──

interface TestState {
  count: number;
  lastEffect: string | null;
}

const store = initKernel<TestState>({ count: 0, lastEffect: null });

// Track effect execution
const effectLog: string[] = [];

// ── Register ──

defineCommand("increment", (ctx) => {
  const s = ctx.state as TestState;
  return { state: { ...s, count: s.count + 1 } };
});

defineCommand("decrement", (ctx) => {
  const s = ctx.state as TestState;
  return { state: { ...s, count: s.count - 1 } };
});

defineCommand("increment-and-notify", (ctx) => {
  const s = ctx.state as TestState;
  return {
    state: { ...s, count: s.count + 1, lastEffect: "notified" },
    notify: `count is now ${s.count + 1}`,
  };
});

defineEffect("notify", (message) => {
  effectLog.push(message as string);
});

// ── Test helpers ──

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

// ── Tests ──

console.log("\n🔬 Kernel Step 1 — Dispatch Loop\n");

console.log("─── defineCommand ───");
dispatch({ type: "increment" });
assert(store.getState().count === 1, "increment → count = 1");

dispatch({ type: "increment" });
dispatch({ type: "increment" });
assert(store.getState().count === 3, "3x increment → count = 3");

dispatch({ type: "decrement" });
assert(store.getState().count === 2, "decrement → count = 2");

console.log("\n─── defineCommand + defineEffect ───");
dispatch({ type: "increment-and-notify" });
assert(store.getState().count === 3, "command → count = 3");
assert(
  store.getState().lastEffect === "notified",
  "command → lastEffect = 'notified'",
);
assert(effectLog.length === 1, "effect executed once");
assert(effectLog[0] === "count is now 3", `effect received: "${effectLog[0]}"`);

console.log("\n─── Transaction Log ───");
const txs = getTransactions();
assert(txs.length === 5, `${txs.length} transactions recorded`);

const lastTx = getLastTransaction()!;
assert(
  lastTx.command.type === "increment-and-notify",
  `last command: "${lastTx.command.type}"`,
);
assert(
  lastTx.handlerType === "command",
  `handler type: "${lastTx.handlerType}"`,
);
assert(lastTx.effects !== null, "effects recorded in transaction");
assert((lastTx.stateBefore as TestState).count === 2, "stateBefore.count = 2");
assert((lastTx.stateAfter as TestState).count === 3, "stateAfter.count = 3");

console.log("\n─── Time Travel ───");
travelTo(0); // After first increment
assert(store.getState().count === 1, "travel to tx 0 → count = 1");

travelTo(2); // after 3rd increment
assert(store.getState().count === 3, "travel to tx 2 → count = 3");

console.log("\n─── Re-entrance (dispatch inside effect) ───");
clearTransactions();
defineEffect("re-dispatch", (cmd) => {
  dispatch(cmd as { type: string; payload?: unknown });
});

defineCommand("set-count", (ctx, payload) => {
  const s = ctx.state as TestState;
  return { state: { ...s, count: payload as number } };
});

defineCommand("reset-then-increment", (ctx) => ({
  state: { ...(ctx.state as TestState), count: 0 },
  "re-dispatch": { type: "increment" },
}));

dispatch({ type: "reset-then-increment" });
assert(
  store.getState().count === 1,
  "re-entrance: reset(0) then increment(1) → count = 1",
);

const reTxs = getTransactions();
assert(reTxs.length === 2, `re-entrance created ${reTxs.length} transactions`);
assert(
  reTxs[0].command.type === "reset-then-increment",
  "tx 0: reset-then-increment",
);
assert(
  reTxs[1].command.type === "increment",
  "tx 1: increment (from re-dispatch)",
);

console.log("\n─── Unknown command warning ───");
dispatch({ type: "nonexistent" }); // Should warn but not crash
assert(true, "unknown command type did not crash");

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed`);
}
