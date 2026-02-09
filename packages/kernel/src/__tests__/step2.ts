/**
 * Kernel Step 2 Verification — Middleware
 *
 * Run: npx tsx packages/kernel/src/__tests__/step2.ts
 * Tests: kernel.use(), before/after chain, command transformation, effect modification.
 */

import { createKernel, GLOBAL } from "../internal.ts";

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

{
  const kernel = createKernel<{ count: number; log: string[] }>({
    count: 0,
    log: [],
  });
  const beforeLog: string[] = [];
  const effectLog: string[] = [];

  const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {
    effectLog.push(msg);
  });

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

  kernel.dispatch(INCREMENT());
  assert(
    beforeLog[0] === "before:INCREMENT",
    `before hook ran: "${beforeLog[0]}"`,
  );
  assert(beforeLog[1] === "after:INCREMENT", `after hook ran: "${beforeLog[1]}"`);
  assert(kernel.getState().count === 1, "handler still executed");

  // --- Test 2: Before can transform command ---
  console.log("\n─── command transformation ───");

  void kernel.defineCommand("ALIASED", (ctx) => () => ({
    state: { ...ctx.state, count: 999 },
  }));

  const ALIAS_ME = kernel.defineCommand("ALIAS_ME", (ctx) => () => ({
    state: ctx.state,
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

  kernel.dispatch(ALIAS_ME());
  assert(
    kernel.getState().count === 999,
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

  kernel.dispatch(SHOUT());
  assert(kernel.getState().count === 42, "command executed → count = 42");
  assert(
    effectLog[effectLog.length - 1] === "HELLO",
    `after modified effect: "${effectLog[effectLog.length - 1]}"`,
  );
}

// --- Test 4: Multiple middlewares — order ---
console.log("\n─── middleware order ───");

{
  const kernel = createKernel<{ count: number }>({ count: 0 });
  const orderLog: string[] = [];

  const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
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

  kernel.dispatch(INCREMENT());
  assert(
    orderLog.join(" → ") ===
    "A:before → B:before → C:before → C:after → B:after → A:after",
    `onion order: ${orderLog.join(" → ")}`,
  );
}

// --- Test 5: Middleware dedup by id ---
console.log("\n─── middleware dedup ───");

{
  const kernel = createKernel<{ count: number }>({ count: 0 });
  const dedupLog: string[] = [];

  const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
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

  kernel.dispatch(INCREMENT());
  assert(dedupLog.length === 1, `dedup: ran ${dedupLog.length} time(s)`);
  assert(dedupLog[0] === "v2", `dedup: latest version ran: "${dedupLog[0]}"`);
}

// --- Test 6: Transaction log records middleware-modified command ---
console.log("\n─── transaction records transformed command ───");

{
  const kernel = createKernel<{ count: number }>({ count: 0 });

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

  kernel.dispatch(ORIGINAL());
  const txs = kernel.getTransactions();
  assert(
    txs[0].command.type === "ALIASED",
    `transaction recorded transformed type: "${txs[0].command.type}"`,
  );
}

// ── Summary ──

console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(40)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed`);
}
