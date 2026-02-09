/**
 * @kernel — Public API
 *
 * Minimal surface for external consumers.
 * For test / internal use, import from "./internal.ts" instead.
 *
 * Core API:
 *   createKernel     → Group (root)
 *   Group.group()    → Group (child, with scope + inject)
 *   Group.defineCommand  → CommandFactory
 *   Group.defineEffect   → EffectToken
 *   Group.defineContext   → ContextToken
 *   Group.dispatch       → void
 */

// ─── Dispatch ───
export { dispatch } from "./core/pipeline.ts";
// ─── Inspector ───
export type { Transaction } from "./core/transaction.ts";
export {
  clearTransactions,
  getTransactions,
  travelTo,
} from "./core/transaction.ts";
// ─── Entry Point ───
export { createKernel, initKernel, state } from "./createKernel.ts";

// ─── React ───
export { useComputed } from "./react/useComputed.ts";
