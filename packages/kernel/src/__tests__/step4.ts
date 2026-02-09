/**
 * Kernel Step 4 Verification — computeChanges (deep diff) + getState / resetState
 *
 * Run: npx tsx packages/kernel/src/__tests__/step4.ts
 * Tests: StateDiff generation, getState, resetState.
 */

import {
  defineCommand,
  dispatch,
  getLastTransaction,
  getState,
  initKernel,
  resetState,
  type StateDiff,
  unbindStore,
} from "../index.ts";

// ── Setup ──

interface TestState {
  count: number;
  user: { name: string; age: number };
  items: string[];
  meta: { tags: string[]; nested: { x: number; y: number } };
}

const INITIAL: TestState = {
  count: 0,
  user: { name: "Alice", age: 30 },
  items: ["a", "b", "c"],
  meta: { tags: ["foo"], nested: { x: 1, y: 2 } },
};

initKernel<TestState>({ ...INITIAL, items: [...INITIAL.items] });

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

console.log("\n🔬 Kernel Step 4 — computeChanges + getState / resetState\n");

// --- Test 1: Simple scalar change ---
console.log("─── scalar change ───");

defineCommand<TestState>("set-count", (ctx, payload) => ({
  state: { ...ctx.state, count: payload as number },
}));

dispatch({ type: "set-count", payload: 42 });
const tx1 = getLastTransaction()!;
const changes1 = tx1.changes as StateDiff[];
assert(Array.isArray(changes1), "changes is an array");
assert(changes1.length > 0, `has ${changes1.length} diff(s)`);

const countDiff = changes1.find((d) => d.path === "count");
assert(countDiff !== undefined, 'has "count" diff');
assert(countDiff?.from === 0, `count.from = ${countDiff?.from}`);
assert(countDiff?.to === 42, `count.to = ${countDiff?.to}`);

// --- Test 2: Nested object change ---
console.log("\n─── nested object change ───");

defineCommand<TestState>("set-user-name", (ctx, payload) => ({
  state: { ...ctx.state, user: { ...ctx.state.user, name: payload as string } },
}));

dispatch({ type: "set-user-name", payload: "Bob" });
const tx2 = getLastTransaction()!;
const changes2 = tx2.changes as StateDiff[];

const nameDiff = changes2.find((d) => d.path === "user.name");
assert(nameDiff !== undefined, 'has "user.name" diff');
assert(nameDiff?.from === "Alice", `user.name.from = "${nameDiff?.from}"`);
assert(nameDiff?.to === "Bob", `user.name.to = "${nameDiff?.to}"`);

// age should NOT appear (unchanged)
const ageDiff = changes2.find((d) => d.path === "user.age");
assert(ageDiff === undefined, "user.age not in diff (unchanged)");

// --- Test 3: Array change ---
console.log("\n─── array change ───");

defineCommand<TestState>("add-item", (ctx, payload) => ({
  state: { ...ctx.state, items: [...ctx.state.items, payload as string] },
}));

dispatch({ type: "add-item", payload: "d" });
const tx3 = getLastTransaction()!;
const changes3 = tx3.changes as StateDiff[];

const itemDiff = changes3.find((d) => d.path === "items[3]");
assert(itemDiff !== undefined, 'has "items[3]" diff');
assert(itemDiff?.from === undefined, `items[3].from = undefined (new)`);
assert(itemDiff?.to === "d", `items[3].to = "d"`);

// --- Test 4: Deep nested change ---
console.log("\n─── deep nested change ───");

defineCommand<TestState>("set-nested-x", (ctx, payload) => ({
  state: {
    ...ctx.state,
    meta: {
      ...ctx.state.meta,
      nested: { ...ctx.state.meta.nested, x: payload as number },
    },
  },
}));

dispatch({ type: "set-nested-x", payload: 99 });
const tx4 = getLastTransaction()!;
const changes4 = tx4.changes as StateDiff[];

const nestedXDiff = changes4.find((d) => d.path === "meta.nested.x");
assert(nestedXDiff !== undefined, 'has "meta.nested.x" diff');
assert(nestedXDiff?.from === 1, `meta.nested.x.from = ${nestedXDiff?.from}`);
assert(nestedXDiff?.to === 99, `meta.nested.x.to = ${nestedXDiff?.to}`);

// y should NOT appear
const nestedYDiff = changes4.find((d) => d.path === "meta.nested.y");
assert(nestedYDiff === undefined, "meta.nested.y not in diff (unchanged)");

// --- Test 5: No change → empty diffs ---
console.log("\n─── no change → empty diffs ───");

defineCommand<TestState>("noop", (ctx) => ({ state: ctx.state }));

dispatch({ type: "noop" });
const tx5 = getLastTransaction()!;
const changes5 = tx5.changes as StateDiff[];
assert(changes5.length === 0, `no changes: ${changes5.length} diffs`);

// --- Test 6: getState ---
console.log("\n─── getState ───");

const s = getState<TestState>();
assert(s.count === 42, `getState().count = ${s.count}`);
assert(s.user.name === "Bob", `getState().user.name = "${s.user.name}"`);
assert(s.items.length === 4, `getState().items.length = ${s.items.length}`);

// --- Test 7: resetState ---
console.log("\n─── resetState ───");

resetState<TestState>({
  count: 0,
  user: { name: "Reset", age: 1 },
  items: [],
  meta: { tags: [], nested: { x: 0, y: 0 } },
});

const afterReset = getState<TestState>();
assert(afterReset.count === 0, `resetState → count = ${afterReset.count}`);
assert(
  afterReset.user.name === "Reset",
  `resetState → user.name = "${afterReset.user.name}"`,
);
assert(
  afterReset.items.length === 0,
  `resetState → items.length = ${afterReset.items.length}`,
);

// --- Test 8: getState/resetState throw after unbindStore ---
console.log("\n─── getState/resetState after unbindStore ───");

unbindStore();
let threwOnGetState = false;
try {
  getState();
} catch {
  threwOnGetState = true;
}
assert(threwOnGetState, "getState() throws when no store bound");

let threwOnResetState = false;
try {
  resetState({ x: 1 });
} catch {
  threwOnResetState = true;
}
assert(threwOnResetState, "resetState() throws when no store bound");

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed`);
}
