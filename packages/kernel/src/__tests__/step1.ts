/**
 * Kernel Step 1 Verification
 *
 * Run: npx tsx packages/kernel/src/__tests__/step1.ts
 * Tests the full dispatch → handler/command → effect → transaction loop.
 */

import {
    initKernel,
    dispatch,
    defineHandler,
    defineCommand,
    defineEffect,
    getTransactions,
    getLastTransaction,
    travelTo,
    clearTransactions,
    clearAllRegistries,
} from "../index.ts";

// ── Setup ──

interface TestDB {
    count: number;
    lastEffect: string | null;
}

const store = initKernel<TestDB>({ count: 0, lastEffect: null });

// Track effect execution
const effectLog: string[] = [];

// ── Register ──

defineHandler("increment", (db: TestDB) => ({
    ...db,
    count: db.count + 1,
}));

defineHandler("decrement", (db: TestDB) => ({
    ...db,
    count: db.count - 1,
}));

defineCommand("increment-and-notify", (ctx) => {
    const db = ctx.db as TestDB;
    return {
        db: { ...db, count: db.count + 1, lastEffect: "notified" },
        notify: `count is now ${db.count + 1}`,
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

console.log("─── defineHandler ───");
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
assert(store.getState().lastEffect === "notified", "command → lastEffect = 'notified'");
assert(effectLog.length === 1, "effect executed once");
assert(effectLog[0] === "count is now 3", `effect received: "${effectLog[0]}"`);

console.log("\n─── Transaction Log ───");
const txs = getTransactions();
assert(txs.length === 5, `${txs.length} transactions recorded`);

const lastTx = getLastTransaction()!;
assert(lastTx.event.type === "increment-and-notify", `last event: "${lastTx.event.type}"`);
assert(lastTx.handlerType === "command", `handler type: "${lastTx.handlerType}"`);
assert(lastTx.effects !== null, "effects recorded in transaction");
assert((lastTx.dbBefore as TestDB).count === 2, "dbBefore.count = 2");
assert((lastTx.dbAfter as TestDB).count === 3, "dbAfter.count = 3");

console.log("\n─── Time Travel ───");
travelTo(0); // After first increment
assert(store.getState().count === 1, "travel to tx 0 → count = 1");

travelTo(2); // after 3rd increment
assert(store.getState().count === 3, "travel to tx 2 → count = 3");

console.log("\n─── Re-entrance (dispatch inside effect) ───");
clearTransactions();
defineEffect("re-dispatch", (event) => {
    dispatch(event as { type: string; payload?: unknown });
});

defineHandler("set-count", (db: TestDB, payload) => ({
    ...db,
    count: payload as number,
}));

defineCommand("reset-then-increment", (ctx) => ({
    db: { ...(ctx.db as TestDB), count: 0 },
    "re-dispatch": { type: "increment" },
}));

dispatch({ type: "reset-then-increment" });
assert(store.getState().count === 1, "re-entrance: reset(0) then increment(1) → count = 1");

const reTxs = getTransactions();
assert(reTxs.length === 2, `re-entrance created ${reTxs.length} transactions`);
assert(reTxs[0].event.type === "reset-then-increment", "tx 0: reset-then-increment");
assert(reTxs[1].event.type === "increment", "tx 1: increment (from re-dispatch)");

console.log("\n─── Unknown handler warning ───");
dispatch({ type: "nonexistent" }); // Should warn but not crash
assert(true, "unknown event type did not crash");

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) process.exit(1);
