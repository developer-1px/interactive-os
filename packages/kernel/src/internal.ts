/**
 * @internal — Full kernel API for tests and internal use.
 *
 * External consumers should import from "./index.ts" (= "@kernel").
 * This barrel re-exports the public API plus test/internal helpers.
 */

// ─── Public API (re-export everything from index) ───
export {
  createKernel,
  defineScope,
  GLOBAL,
} from "./index.ts";

export type {
  Command,
  CommandFactory,
  ContextToken,
  EffectToken,
  Middleware,
  MiddlewareContext,
  ScopeToken,
  StateDiff,
  Transaction,
} from "./index.ts";

// ─── Type-only exports for advanced usage ───
export type {
  EffectFields,
  InjectResult,
  TypedContext,
  TypedEffectMap,
} from "./core/tokens.ts";
