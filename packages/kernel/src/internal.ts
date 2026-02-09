/**
 * @internal — Full kernel API for tests and internal use.
 *
 * External consumers should import from "./index.ts" (= "@kernel").
 * This barrel re-exports the public API plus test/internal helpers.
 */

export type { Transaction } from "./index.ts";
// ─── Public API (re-export everything from index) ───
export {
  clearTransactions,
  createKernel,
  dispatch,
  getTransactions,
  initKernel,
  state,
  travelTo,
  useComputed,
} from "./index.ts";

// ─── Test / Internal-Only Exports ───

// Context (top-level — tests use this directly)
export { defineContext } from "./core/context.ts";
export type { Store } from "./core/createStore.ts";
// State helpers
export { getState, resetState } from "./core/createStore.ts";
// Group (for advanced usage)
export type { Group } from "./core/group.ts";

// Dispatch / Middleware
export { registerMiddleware as use } from "./core/pipeline.ts";

// Tokens & Types
export type {
  Command,
  CommandFactory,
  ContextToken,
  EffectFields,
  EffectToken,
  InjectResult,
  Middleware,
  MiddlewareContext,
  ScopeToken,
  StateMarker,
  TypedContext,
  TypedEffectMap,
} from "./core/tokens.ts";
export { GLOBAL } from "./core/tokens.ts";

// Inspector (test-only)
export type { StateDiff } from "./core/transaction.ts";
export { getLastTransaction, recordTransaction } from "./core/transaction.ts";

// Entry Point (test-only)
export { defineScope, resetKernel } from "./createKernel.ts";

// React
export { useDispatch } from "./react/useDispatch.ts";
