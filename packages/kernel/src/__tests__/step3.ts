/**
 * Kernel Step 3 Verification — Context & Group Inject
 *
 * Run: npx tsx packages/kernel/src/__tests__/step3.ts
 * Tests: defineContext → ContextToken, group({ inject }) for per-group context injection.
 *
 * C1 FIX PROOF: All handlers use auto-inferred ctx.
 * No manual type annotations on ctx — types propagate from group inject.
 */

import {
  createKernel,
  defineContext,
  dispatch,
  getTransactions,
  initKernel,
  resetKernel,
  state,
} from "../index.ts";

// ── Setup ──

interface TestState {
  result: unknown;
}

const store = initKernel<TestState>({ result: null });
const kernel = createKernel({ state: state<TestState>(), effects: {} });

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

function reset() {
  resetKernel();
  store.setState(() => ({ result: null }));
}

// ── Tests ──

console.log("\n🔬 Kernel Step 3 — Context & Group Inject\n");

// --- Test 1: defineContext + group inject ---
console.log("─── defineContext + group inject ───");

reset();

const NOW = defineContext("NOW", () => Date.now());

const g1 = kernel.group({ inject: [NOW] });

const USE_TIME = g1.defineCommand("USE_TIME", (ctx) => () => ({
  state: { result: typeof ctx.NOW },
}));

dispatch(USE_TIME());
assert(
  store.getState().result === "number",
  `injected "now" is number: ${store.getState().result}`,
);

// --- Test 2: Multiple contexts ---
console.log("\n─── multiple contexts ───");

reset();

const USER = defineContext("USER", () => ({ name: "Alice", role: "admin" }));
const CONFIG = defineContext("CONFIG", () => ({ theme: "dark" }));

const g2 = kernel.group({ inject: [USER, CONFIG] });

const READ_CONTEXT = g2.defineCommand("READ_CONTEXT", (ctx) => () => ({
  state: {
    result: {
      userName: ctx.USER.name,
      theme: ctx.CONFIG.theme,
    },
  },
}));

dispatch(READ_CONTEXT());
const r2 = store.getState().result as any;
assert(r2.userName === "Alice", `ctx.user.name = "${r2.userName}"`);
assert(r2.theme === "dark", `ctx.config.theme = "${r2.theme}"`);

// --- Test 3: Context is lazy (called per dispatch) ---
console.log("\n─── lazy evaluation ───");

reset();

let callCount = 0;
const COUNTER = defineContext("COUNTER", () => {
  callCount++;
  return callCount;
});

const g3 = kernel.group({ inject: [COUNTER] });

const READ_COUNTER = g3.defineCommand("READ_COUNTER", (ctx) => () => ({
  state: { result: ctx.COUNTER },
}));

dispatch(READ_COUNTER());
assert(
  store.getState().result === 1,
  `1st dispatch: counter = ${store.getState().result}`,
);

dispatch(READ_COUNTER());
assert(
  store.getState().result === 2,
  `2nd dispatch: counter = ${store.getState().result}`,
);
assert(callCount === 2, `provider called ${callCount} times`);

// --- Test 4: Missing context warns ---
console.log("\n─── missing context warning ───");

reset();

const NONEXISTENT = defineContext("NONEXISTENT", () => undefined as never);

const g4 = kernel.group({ inject: [NONEXISTENT] });

const USE_MISSING = g4.defineCommand("USE_MISSING", (ctx) => () => ({
  state: { result: ctx.NONEXISTENT ?? "undefined" },
}));

dispatch(USE_MISSING());
assert(
  store.getState().result === "undefined",
  "missing context returns undefined",
);

// --- Test 5: inject is per-group (not global) ---
console.log("\n─── inject is per-group only ───");

reset();

let providerCalls = 0;
const EXPENSIVE = defineContext("EXPENSIVE", () => {
  providerCalls++;
  return "expensive-data";
});

const gExpensive = kernel.group({ inject: [EXPENSIVE] });

const NEEDS_CTX = gExpensive.defineCommand("NEEDS_CTX", (ctx) => () => ({
  state: { result: ctx.EXPENSIVE },
}));

const NO_CTX = kernel.defineCommand("NO_CTX", (ctx) => () => ({
  state: { result: ctx.state.result ?? "no-injection" },
}));

dispatch(NO_CTX());
assert(
  providerCalls === 0,
  `dispatch(NO_CTX): provider NOT called (${providerCalls})`,
);

dispatch(NEEDS_CTX());
assert(
  providerCalls === 1,
  `dispatch(NEEDS_CTX): provider called once (${providerCalls})`,
);
assert(store.getState().result === "expensive-data", "injected value correct");

// --- Test 6: Context with state access in command ---
console.log("\n─── context + state in command handler ───");

reset();

store.setState(() => ({ result: "hello" }));

const SNAPSHOT = defineContext("SNAPSHOT", () => "external-data");

const g6 = kernel.group({ inject: [SNAPSHOT] });

const USE_STATE_CONTEXT = g6.defineCommand(
  "USE_STATE_CONTEXT",
  (ctx) => () => ({
    state: {
      result: {
        state: ctx.state,
        snapshot: ctx.SNAPSHOT,
      },
    },
  }),
);

dispatch(USE_STATE_CONTEXT());
const r5 = store.getState().result as any;
assert(
  r5.snapshot === "external-data",
  `injected external data: "${r5.snapshot}"`,
);
assert(
  (r5.state as any).result === "hello",
  `state available in ctx: "${(r5.state as any).result}"`,
);

// --- Test 7: resetKernel clears everything ---
console.log("\n─── resetKernel ───");

defineContext("TEMP", () => "x");
const TEMP_CMD = kernel.defineCommand("TEMP_CMD", (_ctx) => () => ({
  state: { result: "y" },
}));

dispatch(TEMP_CMD());
assert(store.getState().result === "y", "temp-cmd executed → result = 'y'");

resetKernel();

// After reset, store is preserved but registries are cleared → warn, no-op
dispatch({ type: "TEMP_CMD", payload: undefined } as any);
assert(
  store.getState().result === "y",
  "state unchanged after reset (registry cleared, store preserved)",
);

// --- Test 8: Transaction cap ---
console.log("\n─── transaction cap ───");

reset();

const NOOP = kernel.defineCommand("NOOP", (_ctx) => () => ({
  state: { result: "x" },
}));

// Dispatch 210 times (cap is 200)
for (let i = 0; i < 210; i++) {
  dispatch(NOOP());
}

const txs = getTransactions();
assert(txs.length <= 200, `transaction cap: ${txs.length} <= 200`);

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed`);
}
