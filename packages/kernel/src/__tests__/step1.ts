/**
 * Kernel Step 1 Verification — Type-Strict API
 *
 * Run: npx tsx packages/kernel/src/__tests__/step1.ts
 * Tests the full dispatch → command → effect → transaction loop.
 */

import {
  clearTransactions,
  createKernel,
  dispatch,
  getLastTransaction,
  getTransactions,
  initKernel,
  state,
  travelTo,
} from "../index.ts";

// ── Types ──

interface TestState {
  count: number;
  lastEffect: string | null;
}

// ── Effects ──

const effectLog: string[] = [];

// ── Kernel ──

const kernel = createKernel({ state: state<TestState>(), effects: {} });

const NOTIFY = kernel.defineEffect("NOTIFY", (message: string) => {
  effectLog.push(message);
});

const RE_DISPATCH = kernel.defineEffect(
  "RE_DISPATCH",
  (cmd: { type: string; payload?: unknown }) => {
    dispatch(cmd as any); // re-dispatch uses raw command internally
  },
);

// ── Store ──

const store = initKernel<TestState>({ count: 0, lastEffect: null });

// ── Commands ──

const INCREMENT = kernel.defineCommand(
  "INCREMENT",
  (ctx: { state: TestState }) => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
  }),
);

const DECREMENT = kernel.defineCommand(
  "DECREMENT",
  (ctx: { state: TestState }) => ({
    state: { ...ctx.state, count: ctx.state.count - 1 },
  }),
);

const INCREMENT_AND_NOTIFY = kernel.defineCommand(
  "INCREMENT_AND_NOTIFY",
  (ctx: { state: TestState }) => ({
    state: { ...ctx.state, count: ctx.state.count + 1, lastEffect: "notified" },
    [NOTIFY]: `count is now ${ctx.state.count + 1}`,
  }),
);

void kernel.defineCommand(
  "SET_COUNT",
  (ctx: { state: TestState }, payload: number) => ({
    state: { ...ctx.state, count: payload },
  }),
);

const RESET_THEN_INCREMENT = kernel.defineCommand(
  "RESET_THEN_INCREMENT",
  (ctx: { state: TestState }) => ({
    state: { ...ctx.state, count: 0 },
    [RE_DISPATCH]: INCREMENT(),
  }),
);

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
dispatch(INCREMENT());
assert(store.getState().count === 1, "increment → count = 1");

dispatch(INCREMENT());
dispatch(INCREMENT());
assert(store.getState().count === 3, "3x increment → count = 3");

dispatch(DECREMENT());
assert(store.getState().count === 2, "decrement → count = 2");

console.log("\n─── defineCommand + defineEffect ───");
dispatch(INCREMENT_AND_NOTIFY());
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
  lastTx.command.type === "INCREMENT_AND_NOTIFY",
  `last command: "${lastTx.command.type}"`,
);
assert(
  lastTx.handlerScope === "GLOBAL",
  `handler scope: "${lastTx.handlerScope}"`,
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

dispatch(RESET_THEN_INCREMENT());
assert(
  store.getState().count === 1,
  "re-entrance: reset(0) then increment(1) → count = 1",
);

const reTxs = getTransactions();
assert(reTxs.length === 2, `re-entrance created ${reTxs.length} transactions`);
assert(
  reTxs[0].command.type === "RESET_THEN_INCREMENT",
  "tx 0: RESET_THEN_INCREMENT",
);
assert(
  reTxs[1].command.type === "INCREMENT",
  "tx 1: INCREMENT (from re-dispatch)",
);

console.log("\n─── Unknown command warning ───");
dispatch({ type: "nonexistent", payload: undefined } as any); // intentional raw dispatch for testing
assert(true, "unknown command type did not crash");

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed`);
}
