/**
 * inspectorPort — Narrow, read-only interface between kernel internals and inspector.
 *
 * The port exposes only what the inspector needs:
 * - Command type names (not handler references)
 * - Scope hierarchy (ScopeToken branded)
 * - Transaction history
 * - When guard evaluation (delegates to kernel closure)
 *
 * Follows the Interface Segregation Principle:
 * No handler functions, no middleware functions, no raw internal Maps.
 */

import type { ScopeToken } from "./tokens";
import type { Transaction } from "./transaction";

// ─── Port Interface ───

/** Read-only introspection port — the kernel's "narrow window" for the inspector. */
export interface KernelIntrospectionPort<T = unknown> {
  // State (read-only)
  getState(): T;

  // Registry — returns processed names only, never handler references
  getCommandTypes(scope: ScopeToken): readonly string[];
  getWhenGuardTypes(scope: ScopeToken): readonly string[];
  getMiddlewareIds(scope: ScopeToken): readonly string[];
  getEffectTypes(scope: ScopeToken): readonly string[];
  getAllScopes(): readonly ScopeToken[];

  // Scope tree
  getScopeParent(scope: ScopeToken): ScopeToken | null;
  getScopePath(scope: ScopeToken): readonly ScopeToken[];

  // When guard evaluation (delegates to kernel closure for state access)
  evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null;

  // Transaction log
  getTransactions(): readonly Transaction[];
  getLastTransaction(): Transaction | null;
  clearTransactions(): void;
  travelTo(index: number): void;
}

// ─── Registry Snapshot (returned by inspector.getRegistry()) ───

export interface RegistrySnapshot {
  readonly commands: ReadonlyMap<ScopeToken, readonly string[]>;
  readonly whenGuards: ReadonlyMap<ScopeToken, readonly string[]>;
  readonly scopeTree: ReadonlyMap<ScopeToken, ScopeToken>;
  readonly middleware: ReadonlyMap<ScopeToken, readonly string[]>;
  readonly effects: ReadonlyMap<ScopeToken, readonly string[]>;
}

// ─── Inspector API (returned as kernel.inspector) ───

export interface KernelInspector {
  /** Read-only snapshot of all registered commands, effects, middleware, and scope tree. */
  getRegistry(): RegistrySnapshot;

  /** Evaluate a when guard for a specific scope+type against current state. */
  evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null;

  /** Get all registered scope tokens. */
  getAllScopes(): readonly ScopeToken[];

  /** Get the parent scope of a given scope. */
  getScopeParent(scope: ScopeToken): ScopeToken | null;

  /** Get the bubble path (scope → ... → GLOBAL) for a scope. */
  getScopePath(scope: ScopeToken): readonly ScopeToken[];

  /** Get the full transaction log. */
  getTransactions(): readonly Transaction[];

  /** Get the most recent transaction. */
  getLastTransaction(): Transaction | null;

  /** Clear the transaction log. */
  clearTransactions(): void;

  /** Time-travel to a specific transaction. */
  travelTo(index: number): void;
}

/** @internal Extended inspector with cache invalidation — used only inside createKernel. */
export interface KernelInspectorInternal extends KernelInspector {
  /** Mark the registry cache as stale. Called by kernel on registration changes. */
  invalidateRegistry(): void;
}
