/**
 * Type Proof — Compile-time verification of Kernel v2 type inference.
 *
 * This file should compile with zero errors if the type system is correct.
 * It has NO runtime behavior — only type-level assertions.
 *
 * Run: npx tsc --noEmit packages/kernel/src/__tests__/type-proof.ts
 */

import {
  type ContextToken,
  createKernel,
  defineContext,
  type InjectResult,
  state,
  type TypedContext,
} from "../index.ts";

// ── Setup ──

interface AppState {
  count: number;
  name: string;
}

const kernel = createKernel({ state: state<AppState>(), effects: {} });

const NOTIFY = kernel.defineEffect("NOTIFY", (_msg: string) => {});
const TRACK = kernel.defineEffect(
  "TRACK",
  (_event: { name: string; ts: number }) => {},
);

void NOTIFY;
void TRACK;

// ── Proof 1: ctx.state is auto-typed as AppState ──

const INCREMENT = kernel.defineCommand("INCREMENT", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
  //                      ^^^^^   auto-typed as AppState
}));

void INCREMENT;

// ── Proof 2: payload type is enforced — ctx ALSO auto-typed (Context-First Curried) ──

const SET_COUNT = kernel.defineCommand(
  "SET_COUNT",
  (ctx) => (payload: number) => ({
    // ^^^ ctx auto-typed as AppState! No manual annotation needed.
    state: { ...ctx.state, count: payload },
  }),
);

void SET_COUNT;

// ── Proof 3: EffectMap keys are auto-typed ──

const NOTIFY_CMD = kernel.defineCommand("NOTIFY_CMD", (ctx) => () => ({
  state: ctx.state,
  NOTIFY: `count is ${ctx.state.count}`,
  // ^^^^^  auto-typed as string (from NOTIFY effect)
}));

void NOTIFY_CMD;

// ── Proof 4: Context injection via group({ inject }) ──

const NOW = defineContext("NOW", (): number => Date.now());
const USER_INFO = defineContext("USER_INFO", () => ({
  name: "Alice",
  role: "admin" as const,
}));

const injectedGroup = kernel.group({ inject: [NOW, USER_INFO] });

const USE_CONTEXT = injectedGroup.defineCommand("USE_CONTEXT", (ctx) => () => {
  // ctx.NOW is auto-typed as number
  const timestamp: number = ctx.NOW;
  // ctx["USER_INFO"] is auto-typed
  const userName: string = ctx["USER_INFO"].name;
  const role: "admin" = ctx["USER_INFO"].role;
  // ctx.state is still AppState
  const count: number = ctx.state.count;

  void timestamp;
  void userName;
  void role;
  void count;

  return { state: ctx.state };
});

void USE_CONTEXT;

// ── Proof 5: Single context injection via group ──

const singleGroup = kernel.group({ inject: [NOW] });

const USE_SINGLE = singleGroup.defineCommand("USE_SINGLE", (ctx) => () => {
  const n: number = ctx.NOW;
  void n;
  return { state: ctx.state };
});

void USE_SINGLE;

// ── Proof 6: InjectResult utility type ──

type _Proof6 = InjectResult<
  [ContextToken<"NOW", number>, ContextToken<"USER", { name: string }>]
>;
// Expected: { NOW: number; USER: { name: string } }

const _p6: _Proof6 = { NOW: 1, USER: { name: "x" } };
void _p6;

// ── Proof 7: ctx without inject has only state ──

const NO_INJECT = kernel.defineCommand("NO_INJECT", (ctx) => () => {
  const _count: number = ctx.state.count;
  void _count;
  return { state: ctx.state };
});

void NO_INJECT;

// ── Proof 8: TypedContext utility ──

type _Proof8 = TypedContext<AppState, { NOW: number }>;
// Expected: { readonly state: AppState } & Readonly<{ NOW: number }>

const _p8: _Proof8 = { state: { count: 0, name: "" }, NOW: 1 };
void _p8;

// ── Proof 9: Curried payload handler — ctx auto-inferred ──

const CURRIED = kernel.defineCommand(
  "CURRIED",
  (ctx) => (payload: { x: number; y: string }) => {
    // Both payload AND ctx are fully typed — zero annotations on ctx!
    const _x: number = payload.x;
    const _y: string = payload.y;
    const _count: number = ctx.state.count;
    void _x;
    void _y;
    void _count;
    return { state: ctx.state };
  },
);

void CURRIED;

console.log("✅ All type proofs compile successfully");
