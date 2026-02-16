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

export type {
  BaseCommand,
  Command,
  CommandFactory,
  ContextToken,
  EffectToken,
  Middleware,
  MiddlewareContext,
  ScopeToken,
} from "./core/tokens.ts";
export { GLOBAL } from "./core/tokens.ts";
export type { Transaction } from "./core/transaction.ts";
export { createKernel, defineScope } from "./createKernel.ts";
