/**
 * @kernel — Public API
 *
 * Minimal surface for external consumers.
 *
 * Core API:
 *   createKernel(initialState) → Kernel instance
 *   kernel.defineCommand       → CommandFactory
 *   kernel.defineEffect        → EffectToken
 *   kernel.defineContext        → ContextToken
 *   kernel.dispatch             → void
 *   kernel.useComputed          → T (React hook)
 *   kernel.group()              → child Group
 */

// ─── Entry Point ───
export { createKernel, defineScope } from "./createKernel.ts";

// ─── Types ───
export type { Transaction, StateDiff } from "./core/transaction.ts";
export type {
  Command,
  CommandFactory,
  ContextToken,
  EffectToken,
  ScopeToken,
  Middleware,
  MiddlewareContext,
} from "./core/tokens.ts";
export { GLOBAL } from "./core/tokens.ts";
