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

// ─── Entry Point ───
export { createKernel, defineScope, state } from "./createKernel.ts";

// ─── API Methods ───
export { defineContext } from "./defineContext.ts";
export { dispatch } from "./dispatch.ts";
export type { StateDiff, Transaction } from "./inspect.ts";
// ─── Inspector ───
export {
  clearTransactions,
  getLastTransaction,
  getTransactions,
  recordTransaction,
  travelTo,
} from "./inspect.ts";
// ─── React ───
export { useComputed } from "./react/useComputed.ts";
export { useDispatch } from "./react/useDispatch.ts";
export type { Store } from "./store.ts";
// ─── State / Store ───
export {
  bindStore,
  createStore,
  getActiveStore,
  getState,
  initKernel,
  resetKernel,
  resetState,
  unbindStore,
} from "./store.ts";
// ─── Types ───
export * from "./types.ts";
export { use } from "./use.ts";
