/**
 * createInspector — Inspector implementation backed by KernelIntrospectionPort.
 *
 * - Depends ONLY on the narrow port interface, never on raw kernel internals.
 * - Caches the registry snapshot with a dirty flag for O(1) repeated access.
 * - All ScopeToken brand types are preserved end-to-end.
 */

import type {
  KernelInspectorInternal,
  KernelIntrospectionPort,
  RegistrySnapshot,
} from "./core/inspectorPort";
import type { ScopeToken } from "./core/tokens";

export function createInspector<T>(
  port: KernelIntrospectionPort<T>,
): KernelInspectorInternal {
  // ─── Registry Cache (dirty flag pattern) ───
  let registryCache: RegistrySnapshot | null = null;
  let registryDirty = true;

  function buildRegistrySnapshot(): RegistrySnapshot {
    const scopes = port.getAllScopes();

    const commands = new Map<ScopeToken, readonly string[]>();
    const whenGuards = new Map<ScopeToken, readonly string[]>();
    const middleware = new Map<ScopeToken, readonly string[]>();
    const effects = new Map<ScopeToken, readonly string[]>();
    const scopeTree = new Map<ScopeToken, ScopeToken>();

    for (const scope of scopes) {
      const cmdTypes = port.getCommandTypes(scope);
      if (cmdTypes.length > 0) commands.set(scope, cmdTypes);

      const guardTypes = port.getWhenGuardTypes(scope);
      if (guardTypes.length > 0) whenGuards.set(scope, guardTypes);

      const mwIds = port.getMiddlewareIds(scope);
      if (mwIds.length > 0) middleware.set(scope, mwIds);

      const effectTypes = port.getEffectTypes(scope);
      if (effectTypes.length > 0) effects.set(scope, effectTypes);

      const parent = port.getParent(scope);
      if (parent !== null) scopeTree.set(scope, parent);
    }

    return { commands, whenGuards, scopeTree, middleware, effects };
  }

  return {
    getRegistry(): RegistrySnapshot {
      if (registryDirty || !registryCache) {
        registryCache = buildRegistrySnapshot();
        registryDirty = false;
      }
      return registryCache;
    },

    invalidateRegistry() {
      registryDirty = true;
    },

    evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null {
      return port.evaluateWhenGuard(scope, type);
    },

    getAllScopes(): readonly ScopeToken[] {
      return port.getAllScopes();
    },

    getScopeParent(scope: ScopeToken): ScopeToken | null {
      return port.getParent(scope);
    },

    getScopePath(scope: ScopeToken): readonly ScopeToken[] {
      return port.buildBubblePath(scope);
    },

    getTransactions: port.getTransactions,
    getLastTransaction: port.getLastTransaction,
    clearTransactions: port.clearTransactions,
    travelTo: port.travelTo,
  };
}
