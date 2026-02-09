/**
 * Kernel Step 2 Verification — Middleware
 *
 * Run: npx tsx packages/kernel/src/__tests__/step2.ts
 * Tests: kernel.use(), before/after chain, command transformation, effect modification.
 */

import {
  clearAllRegistries,
  clearTransactions,
  createKernel,
  dispatch,
  GLOBAL,
  getTransactions,
  initKernel,
  state,
} from "../index.ts";

// ── Setup ──

interface TestState {
  count: number;
  log: string[];
}

const store = initKernel<TestState>({ count: 0, log: [] });

// ── Kernel ──

const kernel = createKernel({ state: state<TestState>(), effects: {} });

// ── Effects ──

const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {
  effectLog.push(msg);
});

const effectLog: string[] = [];

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

console.log("\n🔬 Kernel Step 2 — Middleware\n");

// --- Test 1: Before middleware ---
console.log("─── before middleware ───");

const beforeLog: string[] = [];

const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));

kernel.use({
  id: "logger",
  scope: GLOBAL,
  before: (ctx) => {
    beforeLog.push(`before:${ctx.command.type}`);
    return ctx;
  },
  after: (ctx) => {
    beforeLog.push(`after:${ctx.command.type}`);
    return ctx;
  },
});

dispatch(INCREMENT());
assert(
  beforeLog[0] === "before:INCREMENT",
  `before hook ran: "${beforeLog[0]}"`,
);
assert(beforeLog[1] === "after:INCREMENT", `after hook ran: "${beforeLog[1]}"`);
assert(store.getState().count === 1, "handler still executed");

// --- Test 2: Before can transform command ---
console.log("\n─── command transformation ───");

void kernel.defineCommand("ALIASED", (ctx) => () => ({
  state: { ...ctx.state, count: 999 },
}));

// Register a "source" command that will be aliased
const ALIAS_ME = kernel.defineCommand("ALIAS_ME", (ctx) => () => ({
  state: ctx.state, // noop — middleware will transform
}));

kernel.use({
  id: "aliaser",
  scope: GLOBAL,
  before: (ctx) => {
    if (ctx.command.type === "ALIAS_ME") {
      return { ...ctx, command: { ...ctx.command, type: "ALIASED" } };
    }
    return ctx;
  },
});

dispatch(ALIAS_ME());
assert(
  store.getState().count === 999,
  "aliased command executed → count = 999",
);

// --- Test 3: After can modify effects ---
console.log("\n─── effect modification ───");

const SHOUT = kernel.defineCommand("SHOUT", (ctx) => () => ({
  state: { ...ctx.state, count: 42 },
  [NOTIFY]: "hello",
}));

kernel.use({
  id: "uppercaser",
  scope: GLOBAL,
  after: (ctx) => {
    if (ctx.effects?.NOTIFY) {
      return {
        ...ctx,
        effects: {
          ...ctx.effects,
          NOTIFY: (ctx.effects.NOTIFY as string).toUpperCase(),
        },
      };
    }
    return ctx;
  },
});

dispatch(SHOUT());
assert(store.getState().count === 42, "command executed → count = 42");
assert(
  effectLog[effectLog.length - 1] === "HELLO",
  `after modified effect: "${effectLog[effectLog.length - 1]}"`,
);

// --- Test 4: Multiple middlewares — order ---
console.log("\n─── middleware order ───");

clearAllRegistries();
const orderLog: string[] = [];

// Re-register INCREMENT after clear
const INCREMENT2 = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));

kernel.use({
  id: "mw-A",
  scope: GLOBAL,
  before: (ctx) => {
    orderLog.push("A:before");
    return ctx;
  },
  after: (ctx) => {
    orderLog.push("A:after");
    return ctx;
  },
});

kernel.use({
  id: "mw-B",
  scope: GLOBAL,
  before: (ctx) => {
    orderLog.push("B:before");
    return ctx;
  },
  after: (ctx) => {
    orderLog.push("B:after");
    return ctx;
  },
});

kernel.use({
  id: "mw-C",
  scope: GLOBAL,
  before: (ctx) => {
    orderLog.push("C:before");
    return ctx;
  },
  after: (ctx) => {
    orderLog.push("C:after");
    return ctx;
  },
});

dispatch(INCREMENT2());
assert(
  orderLog.join(" → ") ===
    "A:before → B:before → C:before → C:after → B:after → A:after",
  `onion order: ${orderLog.join(" → ")}`,
);

// --- Test 5: Middleware dedup by id ---
console.log("\n─── middleware dedup ───");

clearAllRegistries();
const dedupLog: string[] = [];

const INCREMENT3 = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));

kernel.use({
  id: "dedup-test",
  scope: GLOBAL,
  before: (ctx) => {
    dedupLog.push("v1");
    return ctx;
  },
});

kernel.use({
  id: "dedup-test",
  scope: GLOBAL,
  before: (ctx) => {
    dedupLog.push("v2");
    return ctx;
  },
});

dispatch(INCREMENT3());
assert(dedupLog.length === 1, `dedup: ran ${dedupLog.length} time(s)`);
assert(dedupLog[0] === "v2", `dedup: latest version ran: "${dedupLog[0]}"`);

// --- Test 6: Transaction log records middleware-modified command ---
console.log("\n─── transaction records transformed command ───");

clearTransactions();
clearAllRegistries();

void kernel.defineCommand("ALIASED", (ctx) => () => ({
  state: { ...ctx.state, count: 777 },
}));

const ORIGINAL = kernel.defineCommand("ORIGINAL", (ctx) => () => ({
  state: ctx.state,
}));

kernel.use({
  id: "transform-test",
  scope: GLOBAL,
  before: (ctx) => {
    if (ctx.command.type === "ORIGINAL") {
      return { ...ctx, command: { ...ctx.command, type: "ALIASED" } };
    }
    return ctx;
  },
});

dispatch(ORIGINAL());
const txs = getTransactions();
assert(
  txs[0].command.type === "ALIASED",
  `transaction recorded transformed type: "${txs[0].command.type}"`,
);

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed`);
}
