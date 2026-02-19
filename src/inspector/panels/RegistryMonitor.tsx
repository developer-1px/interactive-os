import type { RegistrySnapshot } from "@kernel/core/inspectorPort";
import type { ScopeToken } from "@kernel/core/tokens";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { kernel } from "@/os/kernel";

// ═══════════════════════════════════════════════════════════════════
// Registry Monitor v5 — Reads directly from kernel.inspector
//
// No more GroupRegistry. The kernel is the Single Source of Truth.
// Data flows: kernel closures → introspectionPort → inspector → here.
// ═══════════════════════════════════════════════════════════════════

interface ScopeData {
  scope: ScopeToken;
  commands: readonly string[];
  whenGuards: readonly string[];
  middleware: readonly string[];
  effects: readonly string[];
  children: ScopeToken[];
  depth: number;
}

/** Build a tree-ordered list of scopes from the registry snapshot. */
function buildScopeTree(registry: RegistrySnapshot): ScopeData[] {
  // Collect all scopes
  const allScopes = new Set<string>();
  for (const s of registry.commands.keys()) allScopes.add(s as string);
  for (const s of registry.effects.keys()) allScopes.add(s as string);
  for (const s of registry.middleware.keys()) allScopes.add(s as string);
  for (const [child, parent] of registry.scopeTree) {
    allScopes.add(child as string);
    allScopes.add(parent as string);
  }

  // Build children map
  const childrenMap = new Map<string, string[]>();
  for (const s of allScopes) childrenMap.set(s, []);
  for (const [child, parent] of registry.scopeTree) {
    const arr = childrenMap.get(parent as string);
    if (arr) arr.push(child as string);
  }

  // DFS ordering from GLOBAL root
  const result: ScopeData[] = [];
  const visited = new Set<string>();

  function dfs(scope: string, depth: number) {
    if (visited.has(scope)) return;
    visited.add(scope);

    const children = childrenMap.get(scope) ?? [];
    result.push({
      scope: scope as ScopeToken,
      commands: registry.commands.get(scope as ScopeToken) ?? [],
      whenGuards: registry.whenGuards.get(scope as ScopeToken) ?? [],
      middleware: registry.middleware.get(scope as ScopeToken) ?? [],
      effects: registry.effects.get(scope as ScopeToken) ?? [],
      children: children as ScopeToken[],
      depth,
    });

    for (const child of children.sort()) {
      dfs(child, depth + 1);
    }
  }

  dfs("GLOBAL", 0);

  // Any orphan scopes not reachable from GLOBAL
  for (const s of allScopes) {
    if (!visited.has(s)) dfs(s, 0);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════

function CommandEntry({
  type,
  scope: _scope,
  hasGuard,
  guardEnabled,
  isLastExecuted,
}: {
  type: string;
  scope: ScopeToken;
  hasGuard: boolean;
  guardEnabled: boolean | null;
  isLastExecuted: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-1 border-b border-[#f5f5f5] transition-colors duration-150
        ${isLastExecuted ? "animate-flash-command bg-[#007acc]/8" : "hover:bg-[#fafafa]"}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-1 h-1 rounded-full flex-shrink-0 transition-colors ${isLastExecuted
              ? "bg-[#007acc] shadow-[0_0_4px_#007acc]"
              : guardEnabled === false
                ? "bg-[#f48771]"
                : "bg-[#4ec9b0]"
            }`}
        />
        <span
          className={`text-[9px] font-bold tracking-tight truncate leading-none ${isLastExecuted ? "text-[#007acc]" : "text-[#444]"
            }`}
        >
          {type}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {hasGuard && (
          <div
            title={
              guardEnabled === null
                ? "Guard: N/A"
                : guardEnabled
                  ? "Guard: PASS"
                  : "Guard: BLOCKED"
            }
            className={
              guardEnabled === false ? "text-[#f48771]" : "text-[#4ec9b0]"
            }
          >
            <Shield size={8} />
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeSection({
  data,
  lastCommandType,
  lastCommandScope,
}: {
  data: ScopeData;
  lastCommandType: string | null;
  lastCommandScope: string | null;
}) {
  const [collapsed, setCollapsed] = useState(data.depth > 1);
  const isActive = lastCommandScope === (data.scope as string);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const totalItems =
    data.commands.length + data.middleware.length + data.effects.length;

  if (totalItems === 0 && data.children.length === 0) return null;

  const depthColor =
    data.depth === 0
      ? "bg-[#007acc]"
      : data.depth === 1
        ? "bg-[#4ec9b0]"
        : "bg-[#ce9178]";

  return (
    <section className="border-b border-[#e8e8e8]">
      {/* Scope Header */}
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors
          ${isActive ? "bg-[#007acc]/5" : "bg-[#f8f8f8] hover:bg-[#f0f0f0]"}`}
      >
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${data.depth * 12}px` }}
        >
          {totalItems > 0 ? (
            collapsed ? (
              <ChevronRight size={10} className="text-[#999] flex-shrink-0" />
            ) : (
              <ChevronDown size={10} className="text-[#999] flex-shrink-0" />
            )
          ) : (
            <span className="w-[10px]" />
          )}
          <div className={`w-1 h-3 rounded-full ${depthColor} opacity-60`} />
          <span
            className={`text-[8px] font-black tracking-[0.15em] uppercase ${isActive ? "text-[#007acc]" : "text-[#666]"
              }`}
          >
            {data.scope as string}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {data.commands.length > 0 && (
            <span className="text-[7px] font-mono text-[#999] bg-white px-1 py-0.5 rounded border border-[#e5e5e5]">
              {data.commands.length}cmd
            </span>
          )}
          {data.effects.length > 0 && (
            <span className="text-[7px] font-mono text-[#ce9178] bg-white px-1 py-0.5 rounded border border-[#e5e5e5]">
              {data.effects.length}fx
            </span>
          )}
          {data.middleware.length > 0 && (
            <span className="text-[7px] font-mono text-[#dcdcaa] bg-white px-1 py-0.5 rounded border border-[#e5e5e5]">
              {data.middleware.length}mw
            </span>
          )}
        </div>
      </button>

      {/* Command List */}
      {!collapsed && data.commands.length > 0 && (
        <div className="bg-white">
          {data.commands.map((type) => {
            const hasGuard = data.whenGuards.includes(type);
            const guardEnabled = hasGuard
              ? kernel.inspector.evaluateWhenGuard(data.scope, type)
              : null;
            const isLastExecuted =
              type === lastCommandType &&
              (data.scope as string) === lastCommandScope;

            return (
              <CommandEntry
                key={type}
                type={type}
                scope={data.scope}
                hasGuard={hasGuard}
                guardEnabled={guardEnabled}
                isLastExecuted={isLastExecuted}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Export
// ═══════════════════════════════════════════════════════════════════

export const RegistryMonitor = memo(
  ({ historyCount }: { historyCount: number }) => {
    const registry = kernel.inspector.getRegistry();
    const lastTx = kernel.inspector.getLastTransaction();
    const lastCommandType = lastTx?.command?.type ?? null;
    const lastCommandScope = lastTx?.handlerScope ?? null;

    const scopeTree = useMemo(() => buildScopeTree(registry), [registry]);

    // Summary stats
    let totalCommands = 0;
    let totalScopes = 0;
    for (const s of scopeTree) {
      totalCommands += s.commands.length;
      if (s.commands.length > 0 || s.effects.length > 0) totalScopes++;
    }

    return (
      <div className="flex flex-col flex-1 overflow-auto">
        {/* Summary header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#fafafa] border-b border-[#e8e8e8]">
          <span className="text-[8px] font-bold text-[#999] uppercase tracking-[0.15em]">
            Kernel Registry
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-mono text-[#007acc]">
              {totalCommands} commands
            </span>
            <span className="text-[7px] font-mono text-[#999]">
              {totalScopes} scopes
            </span>
            <span className="text-[7px] font-mono text-[#ccc]">
              #{historyCount}
            </span>
          </div>
        </div>

        {/* Scope Tree */}
        {scopeTree.map((data) => (
          <ScopeSection
            key={data.scope as string}
            data={data}
            lastCommandType={lastCommandType}
            lastCommandScope={lastCommandScope}
          />
        ))}
      </div>
    );
  },
);
