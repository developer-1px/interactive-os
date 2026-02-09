/**
 * @kernel — Type-safe command dispatch with scoped bubbling.
 *
 * Core API:
 *   createKernel     → Group (root)
 *   Group.group()    → Group (child, with scope + inject)
 *   Group.defineCommand  → CommandFactory
 *   Group.defineEffect   → EffectToken
 *   Group.defineContext   → ContextToken
 *   Group.dispatch       → void
 */

// ─── Context ───
export { clearContextProviders, defineContext } from "./core/context.ts";
// ─── State / Store ───
export type { Store } from "./core/createStore.ts";
export {
  bindStore,
  createStore,
  getActiveStore,
  getState,
  resetState,
  unbindStore,
} from "./core/createStore.ts";
// ─── Dispatch ───
// ─── Middleware ───
export { dispatch, registerMiddleware as use } from "./core/pipeline.ts";
// ─── Types ───
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
// ─── Inspector ───
export type { StateDiff, Transaction } from "./core/transaction.ts";
export {
  clearTransactions,
  getLastTransaction,
  getTransactions,
  recordTransaction,
  travelTo,
} from "./core/transaction.ts";
// ─── Entry Point ───
export {
  createKernel,
  defineScope,
  initKernel,
  resetKernel,
  state,
} from "./createKernel.ts";

// ─── React ───
export { useComputed } from "./react/useComputed.ts";
export { useDispatch } from "./react/useDispatch.ts";
