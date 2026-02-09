/**
 * Kernel Step 3 Verification — Context & Inject (per-command)
 *
 * Run: npx tsx packages/kernel/src/__tests__/step3.ts
 * Tests: defineContext, inject (per-command interceptor), context in command handlers.
 */

import {
  defineCommand,
  defineContext,
  dispatch,
  getTransactions,
  initKernel,
  inject,
  resetKernel,
} from "../index.ts";

// ── Setup ──

interface TestDB {
  result: unknown;
}

const store = initKernel<TestDB>({ result: null });

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

console.log("\n🔬 Kernel Step 3 — Context & Inject (per-command)\n");

// --- Test 1: defineContext + inject (per-command) ---
console.log("─── defineContext + inject ───");

reset();

defineContext("now", () => Date.now());

defineCommand<TestDB>(
  "use-time",
  (ctx) => ({
    db: { result: typeof ctx["now"] },
  }),
  [inject("now")],
); // ← per-command interceptor

dispatch({ type: "use-time" });
assert(
  store.getState().result === "number",
  `injected "now" is number: ${store.getState().result}`,
);

// --- Test 2: Multiple contexts ---
console.log("\n─── multiple contexts ───");

reset();

defineContext("user", () => ({ name: "Alice", role: "admin" }));
defineContext("config", () => ({ theme: "dark" }));

defineCommand<TestDB>(
  "read-context",
  (ctx) => ({
    db: {
      result: {
        userName: (ctx["user"] as any)?.name,
        theme: (ctx["config"] as any)?.theme,
      },
    },
  }),
  [inject("user", "config")],
); // ← multiple in one inject

dispatch({ type: "read-context" });
const r2 = store.getState().result as any;
assert(r2.userName === "Alice", `ctx["user"].name = "${r2.userName}"`);
assert(r2.theme === "dark", `ctx["config"].theme = "${r2.theme}"`);

// --- Test 3: Context is lazy (called per dispatch) ---
console.log("\n─── lazy evaluation ───");

reset();

let callCount = 0;
defineContext("counter", () => {
  callCount++;
  return callCount;
});

defineCommand<TestDB>(
  "read-counter",
  (ctx) => ({
    db: { result: ctx["counter"] },
  }),
  [inject("counter")],
);

dispatch({ type: "read-counter" });
assert(
  store.getState().result === 1,
  `1st dispatch: counter = ${store.getState().result}`,
);

dispatch({ type: "read-counter" });
assert(
  store.getState().result === 2,
  `2nd dispatch: counter = ${store.getState().result}`,
);
assert(callCount === 2, `provider called ${callCount} times`);

// --- Test 4: Missing context warns ---
console.log("\n─── missing context warning ───");

reset();

defineCommand<TestDB>(
  "use-missing",
  (ctx) => ({
    db: { result: ctx["nonexistent"] ?? "undefined" },
  }),
  [inject("nonexistent")],
);

dispatch({ type: "use-missing" });
assert(
  store.getState().result === "undefined",
  "missing context returns undefined",
);

// --- Test 5: inject is per-command (not global) ---
console.log("\n─── inject is per-command only ───");

reset();

let providerCalls = 0;
defineContext("expensive", () => {
  providerCalls++;
  return "expensive-data";
});

// Only "needs-ctx" gets inject, "no-ctx" does NOT
defineCommand<TestDB>(
  "needs-ctx",
  (ctx) => ({
    db: { result: ctx["expensive"] },
  }),
  [inject("expensive")],
);

defineCommand<TestDB>("no-ctx", () => ({
  db: { result: "no-injection" },
}));

dispatch({ type: "no-ctx" });
assert(
  providerCalls === 0,
  `dispatch("no-ctx"): provider NOT called (${providerCalls})`,
);

dispatch({ type: "needs-ctx" });
assert(
  providerCalls === 1,
  `dispatch("needs-ctx"): provider called once (${providerCalls})`,
);
assert(store.getState().result === "expensive-data", "injected value correct");

// --- Test 6: Context with db access in command ---
console.log("\n─── context + db in command handler ───");

reset();

store.setState(() => ({ result: "hello" }));

defineContext("dbSnapshot", () => "external-data");

defineCommand<TestDB>(
  "use-db-context",
  (ctx) => ({
    db: {
      result: {
        db: ctx.db,
        snapshot: ctx["dbSnapshot"],
      },
    },
  }),
  [inject("dbSnapshot")],
);

dispatch({ type: "use-db-context" });
const r5 = store.getState().result as any;
assert(
  r5.snapshot === "external-data",
  `injected external data: "${r5.snapshot}"`,
);
assert(
  (r5.db as any).result === "hello",
  `db available in ctx: "${(r5.db as any).result}"`,
);

// --- Test 7: resetKernel clears everything ---
console.log("\n─── resetKernel ───");

// Register some stuff
defineContext("temp", () => "x");
defineCommand<TestDB>("temp-cmd", () => ({ db: { result: "y" } }));

dispatch({ type: "temp-cmd" });

resetKernel();

// After reset, dispatching should warn (no handler)
dispatch({ type: "temp-cmd" }); // will warn, no-op
assert(store.getState().result === "y", "state unchanged after reset dispatch");

// --- Test 8: Transaction cap ---
console.log("\n─── transaction cap ───");

reset();

defineCommand<TestDB>("noop", () => ({ db: { result: "x" } }));

// Dispatch 210 times (cap is 200)
for (let i = 0; i < 210; i++) {
  dispatch({ type: "noop" });
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
