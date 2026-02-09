/**
 * Kernel Step 2 Verification — Middleware
 *
 * Run: npx tsx packages/kernel/src/__tests__/step2.ts
 * Tests: use(), before/after chain, command transformation, effect modification.
 */

import {
    initKernel,
    dispatch,
    defineHandler,
    defineCommand,
    defineEffect,
    use,
    getTransactions,
    clearTransactions,
    clearMiddlewares,
} from "../index.ts";

// ── Setup ──

interface TestDB {
    count: number;
    log: string[];
}

const store = initKernel<TestDB>({ count: 0, log: [] });

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

defineHandler<TestDB>("increment", (db) => ({
    ...db,
    count: db.count + 1,
}));

use({
    id: "logger",
    before: (ctx) => {
        beforeLog.push(`before:${ctx.command.type}`);
        return ctx;
    },
    after: (ctx) => {
        beforeLog.push(`after:${ctx.command.type}`);
        return ctx;
    },
});

dispatch({ type: "increment" });
assert(beforeLog[0] === "before:increment", `before hook ran: "${beforeLog[0]}"`);
assert(beforeLog[1] === "after:increment", `after hook ran: "${beforeLog[1]}"`);
assert(store.getState().count === 1, "handler still executed");

// --- Test 2: Before can transform command ---
console.log("\n─── command transformation ───");

defineHandler<TestDB>("aliased", (db) => ({
    ...db,
    count: 999,
}));

use({
    id: "aliaser",
    before: (ctx) => {
        if (ctx.command.type === "alias-me") {
            return { ...ctx, command: { type: "aliased" } };
        }
        return ctx;
    },
});

dispatch({ type: "alias-me" });
assert(store.getState().count === 999, "aliased command executed → count = 999");

// --- Test 3: After can modify effects ---
console.log("\n─── effect modification ───");

const effectLog: string[] = [];

defineEffect("notify", (msg) => {
    effectLog.push(msg as string);
});

defineCommand<TestDB>("shout", (ctx) => ({
    db: { ...(ctx.db), count: 42 },
    notify: "hello",
}));

use({
    id: "uppercaser",
    after: (ctx) => {
        if (ctx.effects?.notify) {
            return {
                ...ctx,
                effects: {
                    ...ctx.effects,
                    notify: (ctx.effects.notify as string).toUpperCase(),
                },
            };
        }
        return ctx;
    },
});

dispatch({ type: "shout" });
assert(store.getState().count === 42, "command executed → count = 42");
assert(effectLog[effectLog.length - 1] === "HELLO", `after modified effect: "${effectLog[effectLog.length - 1]}"`);

// --- Test 4: Multiple middlewares — order ---
console.log("\n─── middleware order ───");

clearMiddlewares();
const orderLog: string[] = [];

use({
    id: "mw-A",
    before: (ctx) => { orderLog.push("A:before"); return ctx; },
    after: (ctx) => { orderLog.push("A:after"); return ctx; },
});

use({
    id: "mw-B",
    before: (ctx) => { orderLog.push("B:before"); return ctx; },
    after: (ctx) => { orderLog.push("B:after"); return ctx; },
});

use({
    id: "mw-C",
    before: (ctx) => { orderLog.push("C:before"); return ctx; },
    after: (ctx) => { orderLog.push("C:after"); return ctx; },
});

dispatch({ type: "increment" });
assert(
    orderLog.join(" → ") === "A:before → B:before → C:before → C:after → B:after → A:after",
    `onion order: ${orderLog.join(" → ")}`,
);

// --- Test 5: Middleware dedup by id ---
console.log("\n─── middleware dedup ───");

clearMiddlewares();
const dedupLog: string[] = [];

use({
    id: "dedup-test",
    before: (ctx) => { dedupLog.push("v1"); return ctx; },
});

use({
    id: "dedup-test",
    before: (ctx) => { dedupLog.push("v2"); return ctx; },
});

dispatch({ type: "increment" });
assert(dedupLog.length === 1, `dedup: ran ${dedupLog.length} time(s)`);
assert(dedupLog[0] === "v2", `dedup: latest version ran: "${dedupLog[0]}"`);

// --- Test 6: Transaction log records middleware-modified command ---
console.log("\n─── transaction records transformed command ───");

clearTransactions();
clearMiddlewares();

use({
    id: "transform-test",
    before: (ctx) => {
        if (ctx.command.type === "original") {
            return { ...ctx, command: { type: "aliased" } };
        }
        return ctx;
    },
});

dispatch({ type: "original" });
const txs = getTransactions();
assert(txs[0].command.type === "aliased", `transaction recorded transformed type: "${txs[0].command.type}"`);

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
    throw new Error(`${failed} tests failed`);
}
