/**
 * Kernel Step 3 Verification — Context & Inject
 *
 * Run: npx tsx packages/kernel/src/__tests__/step3.ts
 * Tests: defineContext, inject, context in command handlers.
 */

import {
    initKernel,
    dispatch,
    defineCommand,
    defineContext,
    inject,
    clearTransactions,
    clearAllRegistries,
    clearMiddlewares,
    clearContextProviders,
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
    clearAllRegistries();
    clearMiddlewares();
    clearContextProviders();
    clearTransactions();
    store.setState(() => ({ result: null }));
}

// ── Tests ──

console.log("\n🔬 Kernel Step 3 — Context & Inject\n");

// --- Test 1: defineContext + inject ---
console.log("─── defineContext + inject ───");

reset();

defineContext("now", () => Date.now());
inject("now");

defineCommand<TestDB>("use-time", (ctx) => ({
    db: { result: typeof ctx["now"] },
}));

dispatch({ type: "use-time" });
assert(store.getState().result === "number", `injected "now" is number: ${store.getState().result}`);

// --- Test 2: Multiple contexts ---
console.log("\n─── multiple contexts ───");

reset();

defineContext("user", () => ({ name: "Alice", role: "admin" }));
defineContext("config", () => ({ theme: "dark" }));
inject("user", "config");

defineCommand<TestDB>("read-context", (ctx) => ({
    db: {
        result: {
            userName: (ctx["user"] as any)?.name,
            theme: (ctx["config"] as any)?.theme,
        },
    },
}));

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
inject("counter");

defineCommand<TestDB>("read-counter", (ctx) => ({
    db: { result: ctx["counter"] },
}));

dispatch({ type: "read-counter" });
assert(store.getState().result === 1, `1st dispatch: counter = ${store.getState().result}`);

dispatch({ type: "read-counter" });
assert(store.getState().result === 2, `2nd dispatch: counter = ${store.getState().result}`);
assert(callCount === 2, `provider called ${callCount} times`);

// --- Test 4: Missing context warns ---
console.log("\n─── missing context warning ───");

reset();

inject("nonexistent");

defineCommand<TestDB>("use-missing", (ctx) => ({
    db: { result: ctx["nonexistent"] ?? "undefined" },
}));

dispatch({ type: "use-missing" });
assert(store.getState().result === "undefined", "missing context returns undefined");

// --- Test 5: Context with db access ---
console.log("\n─── context can read db from mwCtx ───");

reset();

store.setState(() => ({ result: "hello" }));

defineContext("dbSnapshot", () => {
    // Provider doesn't get db directly — it's a global function
    // In real use, providers may read from DOM or other external sources
    return "external-data";
});
inject("dbSnapshot");

defineCommand<TestDB>("use-db-context", (ctx) => ({
    db: {
        result: {
            db: ctx.db,
            snapshot: ctx["dbSnapshot"],
        },
    },
}));

dispatch({ type: "use-db-context" });
const r5 = store.getState().result as any;
assert(r5.snapshot === "external-data", `injected external data: "${r5.snapshot}"`);
assert((r5.db as any).result === "hello", `db available in ctx: "${(r5.db as any).result}"`);

// --- Test 6: inject deduplicates ---
console.log("\n─── inject dedup ───");

reset();

let providerCalls = 0;
defineContext("dedup-test", () => {
    providerCalls++;
    return "value";
});

// Call inject twice with same id
inject("dedup-test");
inject("dedup-test");

defineCommand<TestDB>("dedup-cmd", (ctx) => ({
    db: { result: ctx["dedup-test"] },
}));

dispatch({ type: "dedup-cmd" });
assert(providerCalls === 1, `provider called ${providerCalls} time(s) (dedup via use())`);
assert(store.getState().result === "value", "value still injected correctly");

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
    throw new Error(`${failed} tests failed`);
}
